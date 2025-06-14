import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import Stripe from 'stripe';
import { saveOrderToSanity } from '@/sanity/lib/client';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Use the latest stable API version
});

// Interface for the raw Shippo transaction response we might expect
interface ShippoTransactionResponse {
  object_id: string;
  tracking_number: string;
  label_url: string;
  status: string; // 'SUCCESS', 'ERROR', etc.
  messages?: Array<{ source?: string; code?: string; text?: string }>;
  rate?: any;
}

// Interface for what this API will return to the frontend on successful order placement
interface OrderPlacementResponse {
    orderId: string;
    trackingNumber: string;
    shippingLabelUrl?: string; // This is the new field
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
      shippoRateId,
      orderId: clientOrderId,
      customerInfo,
      items: itemsFromBody, // Renamed to avoid confusion with mapped items
      shippingDetails,
      stripePaymentIntentId
    } = body;

    console.log("API /placeOrder: Received data:", { shippoRateId, clientOrderId, stripePaymentIntentIdPresent: !!stripePaymentIntentId, customerName: customerInfo?.name });

    if (!shippoRateId || !clientOrderId || !customerInfo || !itemsFromBody || !shippingDetails || !stripePaymentIntentId) {
      console.warn("API /placeOrder: Missing required order or payment details in request body:", body);
      return NextResponse.json({ error: "Missing required order or payment details." }, { status: 400 });
    }

    // --- STEP 1: Verify Stripe Payment Intent Status ---
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        console.error(`API /placeOrder: Stripe Payment Intent ${stripePaymentIntentId} not 'succeeded'. Actual status: ${paymentIntent.status}`);
        return NextResponse.json({ error: `Payment not successful. Status: ${paymentIntent.status}` }, { status: 402 });
      }
      console.log(`API /placeOrder: Stripe Payment Intent ${stripePaymentIntentId} confirmed as 'succeeded'. Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
    } catch (stripeError: any) {
      console.error(`API /placeOrder: Error retrieving/verifying Stripe Payment Intent ${stripePaymentIntentId}:`, stripeError.message);
      return NextResponse.json({ error: "Failed to verify payment.", details: stripeError.message }, { status: 500 });
    }

    // --- STEP 2: Create Shippo Transaction (Purchase Label) ---
    const transactionPayload = {
      rate: shippoRateId,
      label_file_type: "PDF_4x6",
      async: false,
      metadata: `Order ${clientOrderId}`,
    };

    console.log("API /placeOrder: Payload to Shippo Transactions API:", transactionPayload);

    const shippoTransactionResponse = await axios.post<ShippoTransactionResponse>(
      "https://api.goshippo.com/transactions/",
      transactionPayload,
      { headers: { Authorization: `ShippoToken ${shippoApiKey}`, "Content-Type": "application/json" } }
    );

    const shippoTransaction = shippoTransactionResponse.data;
    console.log("API /placeOrder: Full Shippo Transaction Response:", JSON.stringify(shippoTransaction, null, 2));

    // MODIFIED: Check for label_url in the success condition
    if (shippoTransaction.status !== 'SUCCESS' || !shippoTransaction.tracking_number || !shippoTransaction.label_url) {
      console.error(`API /placeOrder: Shippo transaction failed, missing tracking, or missing label URL. Status: ${shippoTransaction.status}. Messages:`, shippoTransaction.messages);
      return NextResponse.json(
        {
          error: "Your payment was successful, but there was an issue generating the shipping label. Please contact support with your Order ID for assistance.",
          internalError: true,
          details: shippoTransaction.messages || "Shipping provider error.",
          orderId: clientOrderId,
          paymentIntentId: stripePaymentIntentId,
          // We don't have a label URL to return here
        },
        { status: 502 }
      );
    }

    console.log(`API /placeOrder: Shippo transaction SUCCESS. Tracking: ${shippoTransaction.tracking_number}, Label URL: ${shippoTransaction.label_url}`);

    // --- STEP 3: Save Order to Sanity ---
    // Your existing console.log statements for debugging
    console.log("DEBUG: customerInfo for address:", JSON.stringify(customerInfo, null, 2));
    console.log("DEBUG: shippingDetails:", JSON.stringify(shippingDetails, null, 2));
    console.log("API /placeOrder - customerInfo for userId:", JSON.stringify(customerInfo, null, 2));
    console.log("API /placeOrder - raw items from body:", JSON.stringify(itemsFromBody, null, 2));
    console.log("API /placeOrder - Full customerInfo object for address:", JSON.stringify(customerInfo, null, 2));

    try {
      const orderDataForSanity = {
        userId: customerInfo?.userId || 'GUEST_USER',
        items: Array.isArray(itemsFromBody) ? itemsFromBody.map((item: any, index: number) => ({
          _key: item.id || item.productId || `item-${Date.now()}-${index}`,
          productId: String(item.productId || item.id || 'UNKNOWN_PRODUCT'),
          name: String(item.title || 'Untitled Product'), // Uses item.title
          quantity: parseInt(item.quantity, 10) || 1,
          price: parseFloat(item.price) || 0,
        })) : [],
        totalAmount: parseFloat(customerInfo.totalPrice),
        status: 'Processing',
        trackingNumber: shippoTransaction.tracking_number,
        shippingAddress: {
          street: String(customerInfo?.address || ''), // Uses customerInfo.address
          city: String(customerInfo?.city || ''),
          state: String(customerInfo?.state || ''),
          zipCode: String(customerInfo?.zip || ''),    // Uses customerInfo.zip
          country: String(customerInfo?.country || ''),
        },
        clientOrderId: clientOrderId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        stripePaymentIntentId: stripePaymentIntentId,
        shippoTransactionId: shippoTransaction.object_id,
        shippoLabelUrl: shippoTransaction.label_url, // Make sure this is saved
        shippingCost: parseFloat(shippingDetails.cost),
        shippingMethod: shippingDetails.description,
        createdAt: new Date().toISOString(), // Explicitly setting for consistency
      };

      console.log("API /placeOrder: Preparing to save order to Sanity:", orderDataForSanity);
      const sanityResult = await saveOrderToSanity(orderDataForSanity);
      console.log("API /placeOrder: Order successfully saved to Sanity. ID:", sanityResult._id);

    } catch (dbError: any) {
      console.error("API /placeOrder: CRITICAL - Failed to save order to Sanity after successful payment and shipping label:", dbError.message);
      // Decide if this should prevent success response. For now, it proceeds.
    }


    // --- STEP 4: Return Confirmation to Frontend ---
    // MODIFIED: Include shippingLabelUrl in the response
    const orderConfirmation: OrderPlacementResponse = {
      orderId: clientOrderId,
      trackingNumber: shippoTransaction.tracking_number,
      shippingLabelUrl: shippoTransaction.label_url, // Add the label URL here
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