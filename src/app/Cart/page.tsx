"use client";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext"; // Assuming this path is correct
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, CreditCard, Info } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateCart } = useCart();
  const [subtotal, setSubtotal] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const total = cart.reduce(
      (acc, item) => acc + item.price * (item.quantity || 1),
      0
    );
    setSubtotal(parseFloat(total.toFixed(2)));
  }, [cart]);

  const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return; // Ensure quantity is at least 1
    updateCart(id, newQuantity);
  };

  const pageBackgroundColor = "#F0F2F5"; // A light grey, similar to common e-commerce backdrops

  return (
    <div style={{ backgroundColor: pageBackgroundColor }} className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-8 md:mb-12">
          Your Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white shadow-xl rounded-xl p-8">
            <ShoppingCart size={64} className="mx-auto text-blue-500 mb-6" />
            <p className="text-xl text-gray-600 mb-8">Your cart is currently empty.</p>
            <Link
              href="/Shop" // Assuming your shop page is at /Shop
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all text-lg transform hover:scale-105"
            >
              Continue Shopping
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:gap-8">
            {/* Cart Items Section */}
            <div className="lg:w-2/3 space-y-6 mb-8 lg:mb-0">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
                >
                  <Link href={`/products/${item.slug || item.id}`} className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </Link>

                  <div className="flex-grow">
                    <Link href={`/products/${item.slug || item.id}`} className="hover:text-blue-600 transition-colors">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
                        {item.title}
                      </h2>
                    </Link>
                    <p className="text-sm text-gray-500 mb-2">
                      Unit Price: ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={item.quantity <= 1}
                        className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-md font-medium text-gray-800 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0 w-full sm:w-auto">
                    <p className="text-md sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} className="mr-1.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Section */}
            <div className="lg:w-1/3 lg:sticky lg:top-24 self-start">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="text-sm font-medium text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Taxes</span>
                    <span className="text-sm font-medium text-gray-500">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Shipping and taxes will be added at checkout.</p>
                </div>
                <button
                  onClick={() => router.push("/Checkout")} // Assuming checkout page is at /Checkout
                  className="w-full flex items-center justify-center bg-green-600 text-white px-6 py-3.5 rounded-lg font-semibold text-lg hover:bg-green-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <CreditCard size={20} className="mr-2.5" />
                  Proceed to Checkout
                </button>
                <div className="mt-6 text-center">
                  <Link
                    href="/Shop"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center"
                  >
                    <ArrowRight size={16} className="mr-1 rotate-180" /> Continue Shopping
                  </Link>
                </div>
                 <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                    <Info size={20} className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                        Secure Checkout: Your payment information is encrypted and protected.
                        For any assistance, please contact our support team.
                    </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}