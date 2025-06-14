"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { useCart } from "../../context/CartContext"; // Ensure path is correct
import validator from "validator";
import axios from 'axios';
import Link from "next/link";
import { useRouter } from 'next/navigation'; // For App Router

import {
  ShoppingCart,
  CreditCard,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  // PackageCheck, // Removed as success UI is on another page
  ChevronLeft,
  Info,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';


// Initialize Stripe outside of the component
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

type ShippingRate = {
  id: string;
  provider?: string;
  servicelevel_name?: string;
  description: string;
  amount: number;
  currency?: string;
  estimated_days?: number;
};

type ApiOrderResponse = {
  orderId: string;
  trackingNumber: string;
  shippingLabelUrl?: string;
};

// It represents the data structure you'll store in sessionStorage.
interface ConfirmedOrderData {
  orderId: string;
  trackingNumber: string;
  shippingLabelUrl?: string;
  customerEmail?: string; // Make sure this matches if you add it
}

const CheckoutFormLogic = () => {
  const { cart, clearCart, removeFromCart } = useCart();
  const router = useRouter();

  const [subtotal, setSubtotal] = useState<number>(0);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRateId, setSelectedShippingRateId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    address: "", address2: "", city: "",
    state: "", zip: "", country: "US",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [paymentApiError, setPaymentApiError] = useState<string | null>(null);

  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [isFinalizingOrder, setIsFinalizingOrder] = useState(false);
  
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
    // Relaxed phone validation to allow more formats, primary validation by Shippo/Stripe
    if (validator.isEmpty(formData.phone) || formData.phone.length < 7) {
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
    } else if (validator.isEmpty(formData.zip) && !["IE", "HK"].includes(countryUpper)) { // Add other countries where ZIP is optional or not used
        setFormError("Postal code is required for the selected country."); return false;
    }

    if (checkAllFieldsForPayment) {
        if (cart.length === 0) {
            setFormError("Your cart is empty."); return false;
        }
        if (shippingRates.length > 0 && !selectedShippingRateId) {
            setFormError("Please select a shipping method."); return false;
        }
         if (shippingRates.length === 0 && cart.length > 0) {
            setFormError("Please calculate shipping first."); return false;
        }
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For country and state, convert to uppercase for consistency
    const processedValue = (name === "country" || name === "state") ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (stripeClientSecret) {
        setStripeClientSecret(null);
        setPaymentApiError("Shipping details changed. Please proceed to payment again to update total and payment details.");
    }
     if (formError) setFormError(null);
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
        addressFrom: { name: "Your Store Name", street1: "123 Main St", city: "Anytown", state: "CA", zip: "90210", country: "US" },
        addressTo: {
          name: formData.name, street1: formData.address, street2: formData.address2,
          city: formData.city, state: formData.state, zip: formData.zip,
          country: formData.country.toUpperCase(), email: formData.email, phone: formData.phone,
        },
        parcels: [{ length: "10", width: "8", height: "4", distance_unit: "in", weight: "2", mass_unit: "lb" }],
      };
      const response = await axios.post<{ rates: ShippingRate[] }>("/api/shippoOrder", payload);
      if (response.data && Array.isArray(response.data.rates)) {
        const validRates = response.data.rates.filter(r => r.id && typeof r.amount === 'number' && r.description);
        setShippingRates(validRates);
        if (validRates.length > 0) {
          setSelectedShippingRateId(validRates[0].id);
          setFormError(null);
        } else {
          setPaymentApiError("No shipping options available for this address. Please check your address details or contact support.");
        }
      } else {
        setPaymentApiError("Could not retrieve shipping rates (invalid response).");
      }
    } catch (error: any) {
      setPaymentApiError(error.response?.data?.error || "Failed to get shipping rates. Please ensure all address fields are correct.");
    } finally {
      setIsLoadingShipping(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!validateForm(true)) return;
    setPaymentApiError(null);
    setIsCreatingPaymentIntent(true);
    try {
      if (grandTotal * 100 < 50) {
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
            line1: formData.address, line2: formData.address2, city: formData.city,
            state: formData.state, postal_code: formData.zip, country: formData.country.toUpperCase(),
        }
      });
      const responseData = piResponse.data as { clientSecret?: string; error?: string };
      if (responseData.clientSecret) {
        setStripeClientSecret(responseData.clientSecret);
      } else {
        throw new Error(responseData.error || "Failed to initialize payment (no client secret).");
      }
    } catch (error: any) {
      setPaymentApiError(error.response?.data?.error || error.message || "Could not connect to payment service.");
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handleFinalizeOrderWithStripe = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setPaymentApiError("Payment system is not fully loaded. Please wait a moment and try again."); return;
    }

    if (!stripeClientSecret) {
      setPaymentApiError("Payment session expired or details changed. Please click 'Proceed to Payment Details' again.");
      // Potentially guide user back to re-initiate payment intent step
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentApiError("Card input is not ready. Please refresh the page or try again."); return;
    }

    setIsStripeProcessing(true); setIsFinalizingOrder(true); setPaymentApiError(null);

    const { error: stripeConfirmError, paymentIntent } = await stripe.confirmCardPayment(stripeClientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: formData.name,
          email: formData.email,
          // address: { // Optional: You can pass full billing address if different from shipping
          //   line1: formData.address,
          //   city: formData.city,
          //   state: formData.state,
          //   postal_code: formData.zip,
          //   country: formData.country.toUpperCase(),
          // }
        },
      },
      // return_url: `${window.location.origin}/order-success-interim`, // Optional: For off-session payments or 3DS
    });

    if (stripeConfirmError) {
      // Handle errors from Stripe.js (e.g., card declined, invalid card number)
      console.error("Stripe.js payment confirmation error:", stripeConfirmError);
      setPaymentApiError(stripeConfirmError.message || "Payment failed. Please check your card details or try another card.");
      setIsStripeProcessing(false);
      setIsFinalizingOrder(false);
      // Depending on the error type, you might want to allow the user to try again
      // For some errors (like 'payment_intent_unexpected_state'), the PI might be unrecoverable
      // and you might need to clear stripeClientSecret to force re-creation.
      if (stripeConfirmError.type === 'validation_error' || stripeConfirmError.type === 'card_error') {
          // Allow retry with same client secret
      } else {
          // For other errors, it might be safer to regenerate the payment intent
          // setStripeClientSecret(null); 
          // setPaymentApiError(stripeConfirmError.message + " Please try initiating the payment again.");
      }
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {

      console.log("Stripe Payment Succeeded. PaymentIntent ID:", paymentIntent.id);

      try {
        const selectedRateObject = shippingRates.find(r => r.id === selectedShippingRateId);
        if (!selectedRateObject) throw new Error("Selected shipping rate details are missing.");

        const orderDataForBackend = {
          shippoRateId: selectedShippingRateId, orderId: `ECOMM_${Date.now()}`,
          customerInfo: { ...formData, totalPrice: grandTotal , email: formData.email }, items: cart,
          shippingDetails: { description: selectedRateObject.description, cost: selectedRateObject.amount },
          stripePaymentIntentId: paymentIntent.id,
        };

        console.log("Calling /api/placeOrder with payload:", orderDataForBackend);

        const finalOrderResponse = await axios.post<ApiOrderResponse>("/api/placeOrder", orderDataForBackend);
        const confirmedOrderDataFromApi = finalOrderResponse.data;
        console.log("/api/placeOrder response:", confirmedOrderDataFromApi);

        if (finalOrderResponse.status === 200 && confirmedOrderDataFromApi && confirmedOrderDataFromApi.orderId) {
          // Construct the object to store, potentially adding more details
          const dataToStoreInSession: ConfirmedOrderData = {
              ...confirmedOrderDataFromApi, // This has orderId, trackingNumber, shippingLabelUrl
              customerEmail: orderDataForBackend.customerInfo.email // Assuming customerInfo has email
          };
          sessionStorage.setItem('latestOrderConfirmation', JSON.stringify(dataToStoreInSession));
          
          clearCart();
          router.push('/order-success');
      } else {
            throw new Error(confirmedOrderDataFromApi.orderId ? "Order placed but response was not OK." : "Failed to place order (no order ID).");
            console.error("/api/placeOrder call seemed successful but response data is invalid:", confirmedOrderDataFromApi);
            setPaymentApiError("Payment succeeded, but there was an issue confirming your order details with our system. Please contact support.");
        }
      } catch (finalOrderError: any) {
        // This catches errors from the axios.post call to /api/placeOrder (e.g., network error, 500 from backend)
        // OR errors thrown manually within the try block (like missing shipping rate)
        console.error("Caught error during final order processing:", finalOrderError);
        
        let displayMessage = "Payment succeeded, but there was an issue finalizing your order with our system. Please contact support.";

        // Manual check for Axios error structure (duck typing)
        // This replaces axios.isAxiosError() for better build compatibility
        if (
            finalOrderError &&
            typeof finalOrderError === 'object' &&
            // Check for properties common to AxiosError instances
            ('isAxiosError' in finalOrderError && finalOrderError.isAxiosError === true) && // Check the flag if it exists
            ('message' in finalOrderError || 'response' in finalOrderError) // It should have a message or a response
        ) {
            // It strongly looks like an AxiosError
            const axiosError = finalOrderError as { // Cast to a shape we expect
                isAxiosError: true;
                message: string;
                code?: string;
                config?: object;
                request?: object;
                response?: {
                    status?: number;
                    data?: any; // Data can be anything
                };
            };

            console.error("Axios-like error detected. Details:", {
                message: axiosError.message,
                code: axiosError.code,
                responseStatus: axiosError.response?.status,
                responseData: axiosError.response?.data,
            });

            if (axiosError.response && axiosError.response.data) {
                const responseData = axiosError.response.data;
                if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
                    const apiError = (responseData as { error?: unknown }).error;
                    if (typeof apiError === 'string' && apiError.trim() !== '') {
                        displayMessage = apiError;
                    } else {
                        displayMessage = axiosError.message || "An error occurred with the server response.";
                    }
                } else if (typeof responseData === 'string' && responseData.trim() !== '') {
                    displayMessage = responseData;
                } else {
                    displayMessage = axiosError.message || "An unidentified error occurred with the server response.";
                }
            } else if (axiosError.message) {
                displayMessage = axiosError.message;
            }
        } else if (finalOrderError instanceof Error) {
            // Handle standard JavaScript Error objects
            console.error("Standard JavaScript error detected:", finalOrderError.message, finalOrderError.stack);
            
            if (finalOrderError.message === "Critical error: Selected shipping rate details are missing during finalization.") {
                displayMessage = finalOrderError.message + " Please refresh and try again.";
            } else if (finalOrderError.message) {
                displayMessage = finalOrderError.message;
            }
        } else {
            // Unknown error type
            console.error("An unknown error type was caught:", finalOrderError);
        }
        
        const paymentIdSuffix = paymentIntent?.id ? ` (Payment ID: ${paymentIntent.id})` : "";
        setPaymentApiError(displayMessage + paymentIdSuffix);
      } finally {
        // Only set these if not navigating away
        // If an error occurred that prevents navigation, then reset loading states.
        // The router.push() should happen before this if successful.
        // This 'finally' might be tricky if navigation happens.
        // Let's assume if an error occurs above, we will fall through here.
        setIsStripeProcessing(false);
        setIsFinalizingOrder(false);
      }
    } else if (paymentIntent) {
      // PaymentIntent exists but status is not 'succeeded' (e.g., 'requires_action', 'processing')
      console.warn("Stripe PaymentIntent status not 'succeeded':", paymentIntent.status, paymentIntent);
      setPaymentApiError(`Payment status: ${paymentIntent.status}. Your payment is not yet complete. Please follow any additional instructions from Stripe or try again.`);
      setIsStripeProcessing(false);
      setIsFinalizingOrder(false);
      // For 'processing', you might tell the user to wait and not retry immediately.
      // For 'requires_action', Stripe.js usually handles 3DS. If it falls here, something is unusual.
      // Do not clear stripeClientSecret here, as the PI might still be completable.
    } else {
      // paymentIntent is null, which means confirmCardPayment itself failed without a PI object (very rare)
      console.error("Stripe confirmCardPayment failed without returning a PaymentIntent object.");
      setPaymentApiError("A critical error occurred with the payment gateway. Please try again or contact support.");
      setIsStripeProcessing(false);
      setIsFinalizingOrder(false);
      setStripeClientSecret(null); // Safer to regenerate PI in this unknown state
    }
  };

  const pageBackgroundColor = "bg-slate-100"; // Using Tailwind class for consistency

  const isButtonProcessing = isLoadingShipping || isCreatingPaymentIntent || isStripeProcessing || isFinalizingOrder;

  return (
    <div className={`${pageBackgroundColor} min-h-screen py-6 md:py-10`}>
      <div className="container mx-auto px-4 sm:px-6"> {/* Simplified container padding */}
        <div className="text-center mb-6 md:mb-10">
          <Link href="/Cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 group text-sm sm:text-base">
            <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-0.5 transition-transform"/> Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800">Secure Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-6 xl:gap-8">
          {/* Left Column: Shipping, Rates, Payment */}
          <div className="w-full lg:w-[60%] xl:w-2/3 order-2 lg:order-1 mb-6 lg:mb-0">
            {/* Stage 1: Shipping Information Form */}
            {!stripeClientSecret && (
              <form onSubmit={fetchShippingRates} className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-5 border-b pb-3 flex items-center">
                  <MapPin size={22} className="mr-2.5 text-blue-600" /> Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4"> {/* Reduced gap slightly */}
                  {[
                    { name: "name", label: "Full Name", type: "text", icon: <User size={16} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "email", label: "Email Address", type: "email", icon: <Mail size={16} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "phone", label: "Phone Number", type: "tel", icon: <Phone size={16} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "address", label: "Street Address", type: "text", icon: <MapPin size={16} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "address2", label: "Apt, Suite, etc. (Optional)", type: "text", icon: <MapPin size={16} className="text-gray-400"/>, colSpan: "sm:col-span-2" },
                    { name: "city", label: "City", type: "text", icon: <MapPin size={16} className="text-gray-400"/> },
                    { name: "state", label: "State/Province", type: "text", icon: <MapPin size={16} className="text-gray-400"/> },
                    { name: "zip", label: "ZIP/Postal Code", type: "text", icon: <MapPin size={16} className="text-gray-400"/> },
                    { name: "country", label: "Country (2-letter code)", type: "text", icon: <MapPin size={16} className="text-gray-400"/>, maxLength: 2 },
                  ].map((field) => (
                    <div key={field.name} className={field.colSpan || ""}>
                      <label htmlFor={field.name} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                          {field.icon && <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center">{field.icon}</div>}
                          <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          value={formData[field.name as keyof typeof formData]}
                          onChange={handleInputChange}
                          maxLength={field.maxLength}
                          className={`block w-full text-gray-900 ${field.icon ? 'pl-8 sm:pl-10' : 'pl-3'} pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400`}
                          placeholder={field.label.split(" (")[0]}
                          required={field.name !== 'address2'}
                          />
                      </div>
                    </div>
                  ))}
                </div>
                {formError && <p className="mt-3 text-red-600 text-xs sm:text-sm flex items-center"><AlertTriangle size={16} className="mr-1.5 flex-shrink-0" />{formError}</p>}
                <button
                  type="submit"
                  disabled={isLoadingShipping || cart.length === 0}
                  className="mt-6 w-full flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingShipping ? <Loader2 size={20} className="animate-spin mr-2" /> : <Truck size={20} className="mr-2" />}
                  {shippingRates.length > 0 ? "Recalculate Shipping" : "Calculate Shipping"}
                </button>
              </form>
            )}

            {/* Stage 2: Shipping Options */}
            {!stripeClientSecret && shippingRates.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-5 border-b pb-3 flex items-center">
                  <Truck size={22} className="mr-2.5 text-blue-600" /> Shipping Options
                </h2>
                <div className="space-y-3"> {/* Reduced space-y */}
                  {shippingRates.map((rateItem) => (
                    <label
                      key={rateItem.id}
                      htmlFor={`shipping-${rateItem.id}`}
                      className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedShippingRateId === rateItem.id ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`shipping-${rateItem.id}`}
                          name="shippingOption"
                          value={rateItem.id}
                          checked={selectedShippingRateId === rateItem.id}
                          onChange={() => { setSelectedShippingRateId(rateItem.id); if(stripeClientSecret) setStripeClientSecret(null); setPaymentApiError(null); }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2 sm:mr-3"
                        />
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium text-gray-800">{rateItem.description || "N/A"}</span>
                          {rateItem.estimated_days !== undefined && <p className="text-gray-500">Est. delivery: {rateItem.estimated_days} days</p>}
                        </div>
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-gray-800 ml-2">${rateItem.amount.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 3: Proceed to Payment Button */}
            {!stripeClientSecret && selectedShippingRateId && cart.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6">
                    <button
                        onClick={handleProceedToPayment}
                        disabled={isCreatingPaymentIntent || isLoadingShipping || !selectedShippingRateId}
                        className="w-full flex items-center justify-center bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isCreatingPaymentIntent ? <Loader2 size={20} className="animate-spin mr-2"/> : <CreditCard size={20} className="mr-2"/>}
                        Proceed to Payment Details
                    </button>
                </div>
            )}
            
            {/* Stage 4: Stripe Card Element Form */}
            {stripeClientSecret && (
              <form onSubmit={handleFinalizeOrderWithStripe} className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-5 border-b pb-3">Enter Payment Details</h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">Complete your order for <strong className="text-gray-800">${grandTotal.toFixed(2)}</strong>.</p>
                <div className="p-3 border border-gray-200 rounded-md bg-slate-50">
                    <CardElement options={{ style: { base: { fontSize: '16px', color: '#32325d', fontFamily: '"Helvetica Neue", Helvetica, sans-serif', '::placeholder': {color: '#aab7c4'} } } }} />
                </div>
                {paymentApiError && <p className="mt-3 text-red-600 text-xs sm:text-sm flex items-center"><AlertTriangle size={16} className="mr-1.5 flex-shrink-0" />{paymentApiError}</p>}
                <button
                  type="submit"
                  disabled={!stripe || !elements || isButtonProcessing}
                  className="mt-6 w-full flex items-center justify-center bg-green-600 text-white px-5 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isButtonProcessing ? <Loader2 size={20} className="animate-spin mr-2" /> : <CreditCard size={20} className="mr-2" />}
                  Pay ${grandTotal.toFixed(2)} and Place Order
                </button>
              </form>
            )}

            {/* General API Error Display (only if not at payment step and not a form validation error) */}
            {paymentApiError && !stripeClientSecret && !formError && (
                 <p className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm flex items-start">
                    <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                    <span>{paymentApiError}</span>
                 </p>
            )}
             {formError && !stripeClientSecret && ( // Show form error if not at payment step
                 <p className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm flex items-start">
                    <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                    <span>{formError}</span>
                 </p>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[40%] xl:w-1/3 order-1 lg:order-2 lg:sticky lg:top-6 self-start"> {/* Adjusted sticky top */}
            <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-5 border-b pb-3 flex items-center">
                <ShoppingCart size={22} className="mr-2.5 text-blue-600" /> Order Summary
              </h2>
              <div className="space-y-3 mb-5 max-h-60 sm:max-h-72 overflow-y-auto pr-1"> {/* Adjusted max-h */}
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                    <img src={item.image} alt={item.title} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-grow min-w-0"> {/* Added min-w-0 for flex truncation */}
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} @ ${item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                            onClick={() => { removeFromCart(item.id); if (stripeClientSecret) setStripeClientSecret(null);}}
                            className="text-xs text-red-500 hover:text-red-700 mt-0.5"
                            aria-label={`Remove ${item.title}`}
                        >
                            Remove
                        </button>
                    </div>
                  </div>
                )) : ( <p className="text-gray-500 text-center py-4 text-sm">Your cart is empty.</p> )}
              </div>
              <div className="space-y-1.5 mb-5 text-sm sm:text-base"> {/* Adjusted font size and spacing */}
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {selectedShippingRateId && shippingRates.length > 0 ? `$${selectedShippingCost.toFixed(2)}` : (cart.length > 0 ? "Select above" : "---")}
                  </span>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
                <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                  <Info size={24} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" /> {/* Adjusted icon size */}
                  <p className="text-xs sm:text-sm text-blue-700">
                      All transactions are secure and encrypted. Please review your order details before proceeding with payment.
                  </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPageWrapper() {
    return (
        <Elements stripe={stripePromise} options={{
            // appearance: { theme: 'stripe' }, // Example themes: 'stripe', 'night', 'flat', 'none'
        }}>
            <CheckoutFormLogic />
        </Elements>
    );
}