// src/app/Checkout/page.tsx
"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { useCart } from "../../context/CartContext"; // Ensure path is correct
import validator from "validator";
import axios from "axios";
import Link from "next/link";
import {
  ShoppingCart,
  CreditCard,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  PackageCheck,
  ChevronLeft,
  Info,
  Loader2,
  AlertTriangle,
  // Icons not used anymore if tracking and cart item removal from this page are gone:
  // Trash2, Minus, Plus, PackageSearch
} from "lucide-react";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe outside of the component to avoid re-creating on every render
// Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is in your .env.local
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Type Definitions ---
type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  slug?: string;
};

// Type for shipping rates received from your API and stored in state
type ShippingRate = {
  id: string; // Unique ID from your API (originally Shippo's rate object_id)
  provider?: string;
  servicelevel_name?: string;
  description: string;
  amount: number; // Numeric amount
  currency?: string;
  estimated_days?: number;
};

// Type for the response from your /api/placeOrder endpoint
type OrderPlacementResponse = {
  orderId: string;
  trackingNumber: string;
  // No carrier needed if not displaying tracking details on success screen immediately
};

// This is the inner component that will use Stripe hooks
const CheckoutFormLogic = () => {
  const { cart, clearCart, removeFromCart } = useCart();
  const [subtotal, setSubtotal] = useState<number>(0);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRateId, setSelectedShippingRateId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    address: "", address2: "", city: "",
    state: "", zip: "", country: "US", // Default country
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [paymentApiError, setPaymentApiError] = useState<string | null>(null);

  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);

  const [orderDetails, setOrderDetails] = useState<OrderPlacementResponse | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setSubtotal(parseFloat(total.toFixed(2)));
  }, [cart]);

  const selectedShippingCost = shippingRates.find((r) => r.id === selectedShippingRateId)?.amount || 0;
  const grandTotal = parseFloat((subtotal + selectedShippingCost).toFixed(2));

  const validateForm = (checkAllFieldsForPayment = false) => {
    setFormError(null);
    if (validator.isEmpty(formData.name) || !validator.isAlpha(formData.name.replace(/\s/g, ''), "en-US", {ignore: "'-"})) {
      setFormError("Please enter a valid full name."); return false;
    }
    if (!validator.isEmail(formData.email)) {
      setFormError("Please enter a valid email address."); return false;
    }
    if (!validator.isMobilePhone(formData.phone.replace(/[^\d]/g, ''), "any", { strictMode: false })) {
      setFormError("Please enter a valid phone number."); return false;
    }
    if (validator.isEmpty(formData.address)) {
      setFormError("Street address cannot be empty."); return false;
    }
    if (validator.isEmpty(formData.city) || !validator.isAlpha(formData.city.replace(/\s/g, ''), "en-US", {ignore: "'-."})) {
      setFormError("Please enter a valid city."); return false;
    }
    if (validator.isEmpty(formData.country) || !/^[A-Za-z]{2}$/.test(formData.country)) {
      setFormError("Please enter a valid 2-letter country code (e.g., US)."); return false;
    }
    const countryUpper = formData.country.toUpperCase();
    if (countryUpper === "US" && (validator.isEmpty(formData.state) || !/^[A-Za-z]{2}$/.test(formData.state))) {
      setFormError("Please enter a valid 2-letter US state code."); return false;
    } else if (countryUpper !== "US" && validator.isEmpty(formData.state)) {
        setFormError("Please enter the province or region."); return false;
    }
    if (countryUpper === "US" && !validator.isPostalCode(formData.zip, "US")) {
      setFormError("Please enter a valid 5-digit US ZIP code."); return false;
    } else if (countryUpper === "CA" && !validator.isPostalCode(formData.zip, "CA")) {
        setFormError("Please enter a valid Canadian Postal code."); return false;
    } else if (validator.isEmpty(formData.zip) && !["IE", "HK"].includes(countryUpper) /* Add countries where ZIP is optional */) {
        setFormError("Postal code is required."); return false;
    }

    if (checkAllFieldsForPayment) {
        if (cart.length === 0) {
            setFormError("Your cart is empty."); return false;
        }
        if (shippingRates.length > 0 && !selectedShippingRateId) {
            setFormError("Please select a shipping method."); return false;
        }
         if (shippingRates.length === 0 && cart.length > 0) { // If cart has items but no rates yet
            setFormError("Please calculate shipping first."); return false;
        }
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (stripeClientSecret) {
        setStripeClientSecret(null);
        setPaymentApiError("Shipping details changed. Please proceed to payment again.");
    }
     if (formError) setFormError(null); // Clear form error on input change
  };

  const fetchShippingRates = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm() || cart.length === 0) {
        if(cart.length === 0 && !formError) setFormError("Your cart is empty.");
        return;
    }
    setIsLoadingShipping(true);
    setPaymentApiError(null);
    setShippingRates([]);
    setSelectedShippingRateId("");
    setStripeClientSecret(null);

    try {
      const payload = {
        addressFrom: { name: "Your Store Name", street1: "123 Main St", city: "Anytown", state: "CA", zip: "90210", country: "US" }, // Your default origin
        addressTo: {
          name: formData.name, street1: formData.address, street2: formData.address2,
          city: formData.city, state: formData.state, zip: formData.zip,
          country: formData.country.toUpperCase(), email: formData.email, phone: formData.phone,
        },
        parcels: [{ length: "10", width: "8", height: "4", distance_unit: "in", weight: "2", mass_unit: "lb" }],
      };
      const response = await axios.post<{ rates: ShippingRate[] }>("/api/shippoOrder", payload);
      console.log("CheckoutPage: Rates received from /api/shippoOrder:", JSON.stringify(response.data, null, 2));

      if (response.data && Array.isArray(response.data.rates)) {
        const validRates = response.data.rates.filter(r => r.id && typeof r.amount === 'number' && r.description);
        setShippingRates(validRates);
        if (validRates.length > 0) {
          setSelectedShippingRateId(validRates[0].id);
          setFormError(null); // Clear form error if rates are found
        } else {
          setPaymentApiError("No shipping options available for this address.");
        }
      } else {
        setPaymentApiError("Could not retrieve shipping rates (invalid response).");
      }
    } catch (error: any) {
      console.error("Error fetching shipping rates:", error);
      setPaymentApiError(error.response?.data?.error || "Failed to get shipping rates. Check address details.");
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateForm(true)) return; // validateForm(true) checks all fields including shipping selection
    setPaymentApiError(null);
    setIsCreatingPaymentIntent(true);
    try {
      console.log("Grand total for Payment Intent:", grandTotal);
      if (grandTotal * 100 < 50) { // Stripe minimum is 50 cents
          setPaymentApiError("Order total is too low for processing. Minimum is $0.50.");
          setIsCreatingPaymentIntent(false);
          return;
      }
      const piResponse = await axios.post("/api/create-payment-intent", {
        amount: Math.round(grandTotal * 100),
        currency: "usd",
        customerName: formData.name,
        customerEmail: formData.email,
        shippingAddress: {
            street1: formData.address, street2: formData.address2, city: formData.city,
            state: formData.state, zip: formData.zip, country: formData.country.toUpperCase(),
        }
      });
      const responseData = piResponse.data as { clientSecret?: string; error?: string };
      if (responseData.clientSecret) {
        setStripeClientSecret(responseData.clientSecret);
      } else {
        throw new Error(responseData.error || "Failed to initialize payment (no client secret).");
      }
    } catch (error: any) {
      console.error("Error creating PaymentIntent:", error);
      setPaymentApiError(error.response?.data?.error || error.message || "Could not connect to payment service.");
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handleFinalizeOrderWithStripe = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !stripeClientSecret) {
      setPaymentApiError("Payment system is not ready. Please refresh or try again.");
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentApiError("Card details component not loaded. Please refresh.");
      return;
    }

    setIsStripeProcessing(true);
    setIsFinalizingOrder(true);
    setPaymentApiError(null);

    const { error: stripeConfirmError, paymentIntent } = await stripe.confirmCardPayment(stripeClientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: formData.name, email: formData.email },
      },
    });

    if (stripeConfirmError) {
      console.error("Stripe payment confirmation error:", stripeConfirmError);
      setPaymentApiError(stripeConfirmError.message || "Payment failed. Check card details or try another card.");
      setIsStripeProcessing(false);
      setIsFinalizingOrder(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log("Stripe Payment Succeeded. PaymentIntent ID:", paymentIntent.id);
      try {
        const selectedRateObject = shippingRates.find(r => r.id === selectedShippingRateId);
        if (!selectedRateObject) throw new Error("Selected shipping rate details are missing during finalization.");

        const orderDataForBackend = {
          shippoRateId: selectedShippingRateId,
          orderId: `ECOMM_${Date.now()}`, // Generate unique order ID
          customerInfo: { ...formData, totalPrice: grandTotal },
          items: cart,
          shippingDetails: { description: selectedRateObject.description, cost: selectedRateObject.amount },
          stripePaymentIntentId: paymentIntent.id,
        };
        const finalOrderResponse = await axios.post<OrderPlacementResponse>("/api/placeOrder", orderDataForBackend);
        setOrderDetails(finalOrderResponse.data);
        clearCart();
        setShippingRates([]);
        setStripeClientSecret(null);
      } catch (finalOrderError: any) {
        console.error("Error in final order placement (after Stripe success):", finalOrderError.response?.data || finalOrderError.message);
        setPaymentApiError(finalOrderError.response?.data?.error || "Payment succeeded, but there was an issue finalizing your order. Please contact support with your transaction details.");
      }
    } else {
      setPaymentApiError(paymentIntent ? `Payment status: ${paymentIntent.status}. Please try again.` : "Payment confirmation failed for an unknown reason.");
    }
    setIsStripeProcessing(false);
    setIsFinalizingOrder(false);
  };

  const pageBackgroundColor = "#F0F2F5";

  if (orderDetails) {
    return (
      <div style={{ backgroundColor: pageBackgroundColor }} className="min-h-screen py-12 md:py-16 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-white shadow-2xl rounded-xl p-8 md:p-12 text-center">
            <PackageCheck size={72} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 text-lg mb-6">Thank you for your purchase. Your order is being processed.</p>
            <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left space-y-3">
              <p className="text-gray-700"><strong className="font-medium text-gray-800">Order ID:</strong> {orderDetails.orderId}</p>
              <p className="text-gray-700"><strong className="font-medium text-gray-800">Tracking Number:</strong> {orderDetails.trackingNumber || "Processing..."}</p>
            </div>
            {paymentApiError && (
                 <p className="text-red-600 my-4 text-sm text-center"><AlertTriangle size={18} className="inline mr-1.5" />{paymentApiError}</p>
            )}
            <Link href="/Shop" className="inline-block mt-10 text-blue-600 hover:text-blue-800 font-medium hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isButtonProcessing = isLoadingShipping || isCreatingPaymentIntent || isStripeProcessing || isFinalizingOrder;

  return (
    <div style={{ backgroundColor: pageBackgroundColor }} className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <Link href="/Cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 group">
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform"/> Back to Cart
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">Secure Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
          {/* Left Column: Shipping, Rates, Payment */}
          <div className="lg:w-[60%] xl:w-2/3 order-2 lg:order-1">
            {/* Stage 1: Shipping Information Form - Show if Payment Intent not created yet */}
            {!stripeClientSecret && (
              <form onSubmit={fetchShippingRates} className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4 flex items-center">
                  <MapPin size={24} className="mr-3 text-blue-600" /> Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  {[
                    { name: "name", label: "Full Name", type: "text", icon: <User size={18} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "email", label: "Email Address", type: "email", icon: <Mail size={18} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "phone", label: "Phone Number", type: "tel", icon: <Phone size={18} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "address", label: "Street Address", type: "text", icon: <MapPin size={18} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "address2", label: "Apt, Suite, etc. (Optional)", type: "text", icon: <MapPin size={18} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "city", label: "City", type: "text", icon: <MapPin size={18} className="text-gray-400"/> },
                    { name: "state", label: "State/Province", type: "text", icon: <MapPin size={18} className="text-gray-400"/> },
                    { name: "zip", label: "ZIP/Postal Code", type: "text", icon: <MapPin size={18} className="text-gray-400"/> },
                    { name: "country", label: "Country (2-letter code, e.g. US)", type: "text", icon: <MapPin size={18} className="text-gray-400"/>, maxLength: 2 },
                  ].map((field) => (
                    <div key={field.name} className={field.colSpan || ""}>
                      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                          {field.icon && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">{field.icon}</div>}
                          <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          value={formData[field.name as keyof typeof formData]}
                          onChange={handleInputChange}
                          maxLength={field.maxLength}
                          className={`block w-full text-gray-900 ${field.icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-gray-400`}
                          placeholder={field.label.replace(/\s\(.+?\)/, '')} // Remove (e.g., CA) from placeholder
                          required={field.name !== 'address2'}
                          />
                      </div>
                    </div>
                  ))}
                </div>
                {formError && <p className="mt-4 text-red-600 text-sm flex items-center"><AlertTriangle size={18} className="mr-1.5" />{formError}</p>}
                <button
                  type="submit"
                  disabled={isLoadingShipping || cart.length === 0}
                  className="mt-8 w-full flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingShipping ? <Loader2 size={22} className="animate-spin mr-2" /> : <Truck size={22} className="mr-2" />}
                  {shippingRates.length > 0 ? "Recalculate Shipping" : "Calculate Shipping"}
                </button>
              </form>
            )}

            {/* Stage 2: Shipping Options - Show if rates are available and PI not created */}
            {!stripeClientSecret && shippingRates.length > 0 && (
              <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4 flex items-center">
                  <Truck size={24} className="mr-3 text-blue-600" /> Shipping Options
                </h2>
                <div className="space-y-4">
                  {shippingRates.map((rateItem, index) => (
                    <React.Fragment key={rateItem.id || `rate-${index}`}>
                      <label
                        htmlFor={`shipping-${rateItem.id}`}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedShippingRateId === rateItem.id ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`shipping-${rateItem.id}`}
                            name="shippingOption"
                            value={rateItem.id}
                            checked={selectedShippingRateId === rateItem.id}
                            onChange={() => { setSelectedShippingRateId(rateItem.id); if(stripeClientSecret) setStripeClientSecret(null); setPaymentApiError(null); }}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                          />
                          <div>
                            <span className="font-medium text-gray-800">{rateItem.description || "N/A"}</span>
                            {rateItem.estimated_days !== undefined && <p className="text-sm text-gray-500">Est. delivery: {rateItem.estimated_days} days</p>}
                          </div>
                        </div>
                        <span className="text-lg font-semibold text-gray-800">${rateItem.amount.toFixed(2)}</span>
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 3: Proceed to Payment Button - Show if rates selected and PI not created */}
            {!stripeClientSecret && selectedShippingRateId && cart.length > 0 && (
                <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8">
                    <button
                        onClick={handleProceedToPayment}
                        disabled={isCreatingPaymentIntent || isLoadingShipping || !selectedShippingRateId}
                        className="w-full flex items-center justify-center bg-indigo-600 text-white px-6 py-3.5 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isCreatingPaymentIntent ? <Loader2 size={22} className="animate-spin mr-2"/> : <CreditCard size={22} className="mr-2"/>}
                        Proceed to Payment Details
                    </button>
                </div>
            )}
            
            {/* Stage 4: Stripe Card Element Form - Show when clientSecret is available */}
            {stripeClientSecret && !orderDetails && (
              <form onSubmit={handleFinalizeOrderWithStripe} className="bg-white shadow-xl rounded-xl p-6 sm:p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">Enter Payment Details</h2>
                <p className="text-sm text-gray-600 mb-4">Please enter your card details below to complete your order for a total of <strong className="text-gray-800">${grandTotal.toFixed(2)}</strong>.</p>
                <div className="p-3 border border-gray-200 rounded-md bg-slate-50">
                    <CardElement options={{ style: { base: { fontSize: '16px', color: '#32325d', '::placeholder': {color: '#aab7c4'} } } }} />
                </div>
                {paymentApiError && <p className="mt-4 text-red-600 text-sm flex items-center"><AlertTriangle size={18} className="mr-1.5" />{paymentApiError}</p>}
                <button
                  type="submit"
                  disabled={!stripe || !elements || isStripeProcessing || isFinalizingOrder}
                  className="mt-8 w-full flex items-center justify-center bg-green-600 text-white px-6 py-3.5 rounded-lg font-semibold text-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {(isStripeProcessing || isFinalizingOrder) ? <Loader2 size={22} className="animate-spin mr-2" /> : <CreditCard size={22} className="mr-2" />}
                  Pay ${grandTotal.toFixed(2)} and Place Order
                </button>
              </form>
            )}

            {/* General API Error Display (for non-payment specific issues if any) */}
            {formError && !stripeClientSecret && ( // Only show formError if not yet on payment step
                 <p className="my-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0"/>
                    <span>{formError}</span>
                 </p>
            )}
          </div>

          {/* Right Column: Order Summary (always visible until order is placed) */}
          {!orderDetails && (
            <div className="lg:w-[40%] xl:w-1/3 order-1 lg:order-2 lg:sticky lg:top-24 self-start">
              <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4 flex items-center">
                  <ShoppingCart size={24} className="mr-3 text-blue-600" /> Order Summary
                </h2>
                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                  {cart.length > 0 ? cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium text-gray-800 leading-tight">{item.title}</h3>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-500">@ ${item.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                          <button
                              onClick={() => { removeFromCart(item.id); if (stripeClientSecret) setStripeClientSecret(null);}} // Reset PI if cart changes
                              className="text-xs text-red-500 hover:text-red-700 mt-1"
                              aria-label={`Remove ${item.title}`}
                          >
                              Remove
                          </button>
                      </div>
                    </div>
                  )) : ( <p className="text-gray-500 text-center py-4">Your cart is empty.</p> )}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {selectedShippingRateId && shippingRates.length > 0 ? `$${selectedShippingCost.toFixed(2)}` : (cart.length > 0 ? "Calculate shipping" : "---")}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                 <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                    <Info size={28} className="text-blue-500 mr-2 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                        All transactions are secure and encrypted. Review your order before payment.
                    </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component that wraps CheckoutFormWithStripeLogic with Elements provider
export default function CheckoutPage() {
    return (
        <Elements stripe={stripePromise} options={{
            // Optional: Define appearance or other global options for Elements
            // appearance: { theme: 'stripe' }, // Example: 'stripe', 'night', 'flat'
            // locale: 'en',
        }}>
            <CheckoutFormLogic />
        </Elements>
    );
}