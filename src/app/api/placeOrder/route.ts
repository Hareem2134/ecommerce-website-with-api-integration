// src/app/api/placeOrder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import Stripe from 'stripe';
import { saveOrderToSanity } from '@/sanity/lib/client';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Use latest stable API version
});

// Interface for the raw Shippo transaction response we might expect
interface ShippoTransactionResponse {
  object_id: string;
  tracking_number: string;
  label_url: string;
  status: string; // 'SUCCESS', 'ERROR', etc.
  messages?: Array<{ source?: string; code?: string; text?: string }>;
  // Potentially other fields like rate details if needed
  rate?: any; // Can be string (ID) or object
}

// Interface for what this API will return to the frontend on successful order placement
interface OrderPlacementResponse {
    orderId: string;
    trackingNumber: string;
    // No carrier needed if not displaying tracking details on success screen immediately
}

export async function POST(req: NextRequest) {
  const shippoApiKey = process.env.SHIPPO_API_KEY;

  if (!shippoApiKey) {
    console.error("API /placeOrder: Shippo API Key is missing from .env.local");
    return NextResponse.json({ error: "Internal server configuration error (shipping)." }, { status: 500 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("API /placeOrder: Stripe Secret Key is missing from .env.local");
    return NextResponse.json({ error: "Internal server configuration error (payment)." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      shippoRateId,          // ID of the selected shipping rate from Shippo
      orderId: clientOrderId, // Your frontend-generated order ID (e.g., ECOMM_TIMESTAMP)
      customerInfo,          // Contains formData (name, email, address, etc.) and totalPrice (grandTotal)
      items,                 // Array of cart items
      shippingDetails,       // Contains description and cost of the selected shipping rate
      stripePaymentIntentId  // The ID of the successful Stripe PaymentIntent
    } = body;

    console.log("API /placeOrder: Received data:", { shippoRateId, clientOrderId, stripePaymentIntentIdPresent: !!stripePaymentIntentId, customerName: customerInfo?.name });

    if (!shippoRateId || !clientOrderId || !customerInfo || !items || !shippingDetails || !stripePaymentIntentId) {
      console.warn("API /placeOrder: Missing required order or payment details in request body:", body);
      return NextResponse.json({ error: "Missing required order or payment details." }, { status: 400 });
    }

    // --- STEP 1: Verify Stripe Payment Intent Status ---
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        console.error(`API /placeOrder: Stripe Payment Intent ${stripePaymentIntentId} not 'succeeded'. Actual status: ${paymentIntent.status}`);
        // TODO: Update order status in your DB to "payment_failed" or similar
        return NextResponse.json({ error: `Payment not successful. Status: ${paymentIntent.status}` }, { status: 402 }); // 402 Payment Required
      }
      console.log(`API /placeOrder: Stripe Payment Intent ${stripePaymentIntentId} confirmed as 'succeeded'. Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
    } catch (stripeError: any) {
      console.error(`API /placeOrder: Error retrieving/verifying Stripe Payment Intent ${stripePaymentIntentId}:`, stripeError.message);
      return NextResponse.json({ error: "Failed to verify payment.", details: stripeError.message }, { status: 500 });
    }

    // --- STEP 2: Create Shippo Transaction (Purchase Label) ---
    const transactionPayload = {
      rate: shippoRateId,
      label_file_type: "PDF_4x6", // Or your preferred label type
      async: false,
      metadata: `Order ${clientOrderId}`, // Optional metadata
    };

    console.log("API /placeOrder: Payload to Shippo Transactions API:", transactionPayload);

    const shippoTransactionResponse = await axios.post<ShippoTransactionResponse>(
      "https://api.goshippo.com/transactions/",
      transactionPayload,
      { headers: { Authorization: `ShippoToken ${shippoApiKey}`, "Content-Type": "application/json" } }
    );

    const shippoTransaction = shippoTransactionResponse.data;
    console.log("API /placeOrder: Full Shippo Transaction Response:", JSON.stringify(shippoTransaction, null, 2));

    if (shippoTransaction.status !== 'SUCCESS' || !shippoTransaction.tracking_number) {
      console.error(`API /placeOrder: Shippo transaction failed or missing tracking. Status: ${shippoTransaction.status}. Messages:`, shippoTransaction.messages);
      // CRITICAL: Payment succeeded, but shipping label failed.
      // This requires robust handling: extensive logging, admin notification,
      // potentially attempt an automatic Stripe refund, and clear user communication.
      // TODO: Implement refund logic or flag for manual review/refund.
      // await stripe.refunds.create({ payment_intent: stripePaymentIntentId, reason: 'requested_by_customer', /* or other reason */ });
      return NextResponse.json(
        {
          error: "Your payment was successful, but there was an issue generating the shipping label. Please contact support with your Order ID for assistance.",
          internalError: true, // Flag for frontend to display a specific message
          details: shippoTransaction.messages || "Shipping provider error.",
          orderId: clientOrderId, // Return orderId so user can reference it
          paymentIntentId: stripePaymentIntentId, // For support to find the payment
        },
        { status: 502 } // 502 Bad Gateway (error from upstream server - Shippo)
      );
    }

    console.log(`API /placeOrder: Shippo transaction SUCCESS. Tracking: ${shippoTransaction.tracking_number}`);

    // --- STEP 3: Save Order to Your Database (Conceptual) ---
    // This is where you would interact with Sanity, Supabase, Prisma, etc.
    try {
      const orderDataForSanity = {
        // Fields from your src/sanity/schemaTypes/order.ts
        // userId: customerInfo.userId || 'GUEST_USER', // Or however you get/define userId. This field is in your schema.
        // If user is not logged in, decide on a placeholder or make it optional in Sanity.
        items: items.map((item: any) => ({ // Assuming 'items' from body has product details
          _key: item.id || item.productId, // Sanity requires a _key for array items
          productId: String(item.id || item.productId), // Ensure it's a string
          name: item.name, // Good to store for easier display in Sanity Studio
          quantity: parseInt(item.quantity, 10),
          price: parseFloat(item.price),
        })),
        totalAmount: parseFloat(customerInfo.totalPrice),
        status: 'Processing', // Or 'Paid', 'Awaiting Shipment'
        trackingNumber: shippoTransaction.tracking_number,
        shippingAddress: {
          _type: 'object', // Not strictly needed here but good for clarity
          street: customerInfo.address?.street || customerInfo.formData?.addressLine1, // Adjust based on your customerInfo structure
          city: customerInfo.address?.city || customerInfo.formData?.city,
          state: customerInfo.address?.state || customerInfo.formData?.state,
          zipCode: customerInfo.address?.zipCode || customerInfo.formData?.postalCode,
          country: customerInfo.address?.country || customerInfo.formData?.countryCode, // e.g., 'US'
        },
        // createdAt is handled by initialValue in Sanity schema, but you can set it explicitly:
        // createdAt: new Date().toISOString(),

        // Optional: Store additional useful info (add these fields to your order.ts schema if you want them)
        clientOrderId: clientOrderId, // Your internal order ID
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        stripePaymentIntentId: stripePaymentIntentId,
        shippoTransactionId: shippoTransaction.object_id,
        shippoLabelUrl: shippoTransaction.label_url,
        shippingCost: parseFloat(shippingDetails.cost),
        shippingMethod: shippingDetails.description,
      };

      console.log("API /placeOrder: Preparing to save order to Sanity:", orderDataForSanity);
      const sanityResult = await saveOrderToSanity(orderDataForSanity);
      console.log("API /placeOrder: Order successfully saved to Sanity. ID:", sanityResult._id);

    } catch (dbError: any) {
      console.error("API /placeOrder: CRITICAL - Failed to save order to Sanity after successful payment and shipping label:", dbError.message);
      // This is a critical error. Payment and shipping are done, but order isn't in DB.
      // - Log this extensively.
      // - Notify administrators.
      // - The user's order *is* placed and paid. They should still get a confirmation,
      //   but you need to manually ensure the order is reconciled in Sanity.
      // Consider not throwing an error back to the user here if payment/shipping was fine,
      // as the order *is* technically processed. Log and alert for backend reconciliation.
      // For now, we'll let the success response proceed, but this needs robust alerting.
    }


    // --- STEP 4: Return Confirmation to Frontend ---
    const orderConfirmation: OrderPlacementResponse = {
      orderId: clientOrderId,
      trackingNumber: shippoTransaction.tracking_number,
    };

    return NextResponse.json(orderConfirmation, { status: 200 });

  } catch (error: any) {
    console.error("API /placeOrder: General Catch Error:", error.response?.data || error.message || error);
    return NextResponse.json(
      { error: "Failed to place order due to an unexpected server error." , details: error.message },
      { status: error.response?.status || 500 }
    );
  }
}