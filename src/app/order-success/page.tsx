'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For App Router
import React, { useEffect, useState, useRef } from 'react';
import { PackageCheck, FileText, ShoppingBag, Home, AlertTriangle, Copy, Check } from 'lucide-react';
import Confetti from 'react-confetti'; // Import the confetti library

// Interface for the confirmed order data expected from sessionStorage
interface ConfirmedOrderData {
  orderId: string;
  trackingNumber: string;
  shippingLabelUrl?: string;
  // You might also have stored customerEmail or other relevant details from CheckoutPage
  customerEmail?: string; // Example: if you decide to pass it
}

const OrderSuccessDisplayPage = () => {
  const router = useRouter();
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Refs for confetti dimensions
  const confettiWrapperRef = useRef<HTMLDivElement>(null);
  const [confettiWidth, setConfettiWidth] = useState(0);
  const [confettiHeight, setConfettiHeight] = useState(0);

  useEffect(() => {
    // Attempt to retrieve order data from sessionStorage
    const storedDataString = sessionStorage.getItem('latestOrderConfirmation');
    if (storedDataString) {
      try {
        const parsedData: ConfirmedOrderData = JSON.parse(storedDataString);
        setConfirmedOrder(parsedData);
        setShowConfetti(true); // Trigger confetti on successful data load
        // Optional: Clear the item from sessionStorage after use to prevent re-display on refresh
        // sessionStorage.removeItem('latestOrderConfirmation');
      } catch (error) {
        console.error("Error parsing stored order data:", error);
        // Handle error, perhaps redirect or show a specific message
      }
    } else {
      console.warn("No order confirmation data found in session storage. User might have refreshed or navigated directly.");
      // Potentially redirect to home or cart if no order data is found,
      // as this page relies on that data.
    }
    setLoading(false);

    // Set confetti dimensions
    if (confettiWrapperRef.current) {
        setConfettiWidth(confettiWrapperRef.current.clientWidth);
        setConfettiHeight(confettiWrapperRef.current.clientHeight);
    }
    // Optional: Stop confetti after a few seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 7000); // Confetti for 7 seconds

    return () => clearTimeout(confettiTimer); // Cleanup timer on unmount

  }, []); // Empty dependency array ensures this runs only once on mount

  const handleCopyToClipboard = (text: string, type: 'orderId' | 'tracking') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'orderId') {
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2000);
      } else {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // You could show a small error toast/message here
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="text-center">
          <PackageCheck size={48} className="mx-auto text-blue-500 animate-pulse mb-4" />
          <p className="text-lg text-gray-700">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  if (!confirmedOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-100">
        <AlertTriangle size={64} className="text-orange-500 mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Oops! Order Details Not Found.</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          We couldn't retrieve your latest order details. This might happen if you refreshed the page or navigated here directly. Please check your email for the order confirmation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/Shop" className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md text-sm sm:text-base">
            <ShoppingBag size={18} className="mr-2" /> Continue Shopping
            </Link>
            <Link href="/" className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-md text-sm sm:text-base">
            <Home size={18} className="mr-2" /> Go to Homepage
            </Link>
        </div>
      </div>
    );
  }

  // USPS Tracking URL (example, adjust if you use other carriers or have a generic tracking page)
  const trackingServiceUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${confirmedOrder.trackingNumber}`;

  return (
    <div ref={confettiWrapperRef} className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10 sm:py-16 flex items-center justify-center overflow-hidden">
      {showConfetti && confettiWidth > 0 && confettiHeight > 0 && (
        <Confetti
          width={confettiWidth}
          height={confettiHeight}
          recycle={false} // Set to true if you want continuous confetti
          numberOfPieces={300} // Adjust number of pieces
          gravity={0.15}
          wind={0.05}
          initialVelocityX={{min: -7, max: 7}}
          initialVelocityY={{min: -15, max: 0}}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 max-w-2xl z-10"> {/* Ensure content is above confetti if it overflows */}
        <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 text-center">
          <PackageCheck size={64} className="mx-auto text-green-500 mb-5 animate-bounce" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 text-base sm:text-lg mb-6">
            Thank you, {confirmedOrder.customerEmail ? `we've sent a confirmation to ${confirmedOrder.customerEmail}.` : 'your order is being processed.'}
          </p>
          
          <div className="bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-lg mb-8 text-left space-y-3 sm:space-y-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Order ID</label>
                <div className="flex items-center justify-between">
                    <p className="text-slate-700 text-sm sm:text-base font-semibold break-all">{confirmedOrder.orderId}</p>
                    <button 
                        onClick={() => handleCopyToClipboard(confirmedOrder.orderId, 'orderId')}
                        title="Copy Order ID"
                        className="p-1.5 text-slate-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md transition-colors ml-2"
                    >
                        {copiedOrderId ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Tracking Number</label>
                <div className="flex items-center justify-between">
                    <p className="text-slate-700 text-sm sm:text-base font-semibold break-all">{confirmedOrder.trackingNumber || "Processing..."}</p>
                    {confirmedOrder.trackingNumber && (
                        <button 
                            onClick={() => handleCopyToClipboard(confirmedOrder.trackingNumber, 'tracking')}
                            title="Copy Tracking Number"
                            className="p-1.5 text-slate-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md transition-colors ml-2"
                        >
                        {copiedTracking ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    )}
                </div>
                {confirmedOrder.trackingNumber && (
                    <a 
                        href={trackingServiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
                    >
                        Track your package
                    </a>
                )}
            </div>
          </div>

          {confirmedOrder.shippingLabelUrl && (
            <div className="mt-6 mb-8 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Your Shipping Label</h2>
              <a
                href={confirmedOrder.shippingLabelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FileText size={18} className="mr-2" /> Download Shipping Label (PDF)
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Opens in a new tab. If it doesn't download automatically, you can save it from there.
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8">
            <Link href="/Shop" className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md text-sm sm:text-base order-2 sm:order-1">
              <ShoppingBag size={18} className="mr-2" /> Continue Shopping
            </Link>
            <Link href="/" className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-md text-sm sm:text-base order-1 sm:order-2">
              <Home size={18} className="mr-2" /> Go to Homepage
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-8">
            If you have any questions, please <Link href="/contact" className="text-blue-600 hover:underline">contact our support team</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessDisplayPage;