// src/app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil', // Use the latest Stripe API version
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'usd', customerName, customerEmail, shippingAddress } = await req.json();

    if (typeof amount !== 'number' || amount <= 50) { // Stripe has minimum amounts (e.g., $0.50 USD)
      return NextResponse.json({ error: 'Invalid amount. Amount must be greater than 50 cents.' }, { status: 400 });
    }

    // You can create a customer or use an existing one for better record keeping
    // For simplicity, we'll pass description and shipping directly to PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount is in the smallest currency unit (e.g., cents)
      currency: currency,
      automatic_payment_methods: { enabled: true }, // Stripe's recommended way
      description: `Order for ${customerName || 'customer'}`,
      receipt_email: customerEmail, // Optional: Stripe can send email receipts
      shipping: shippingAddress ? { // Optional, but good for fraud prevention and display
        name: customerName || 'N/A',
        address: {
          line1: shippingAddress.street1,
          line2: shippingAddress.street2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zip,
          country: shippingAddress.country,
        }
      } : undefined,
      // metadata: { order_id: your_internal_order_id_if_generated_pre_payment }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error("API /create-payment-intent: Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment intent." }, { status: 500 });
  }
}