"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

type ShippingRate = {
  id: string;
  description: string;
  rate: number;
};

const mockShippingRates: ShippingRate[] = [
  { id: "rate_1", description: "Standard Shipping (3-5 days)", rate: 5.99 },
  { id: "rate_2", description: "Express Shipping (1-2 days)", rate: 15.99 },
  { id: "rate_3", description: "Overnight Shipping (next day)", rate: 25.99 },
];

export default function CheckoutPage() {
  const { cart, clearCart, updateCart, removeFromCart } = useCart();
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [shippingOptions, setShippingOptions] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const calculateTotalPrice = () =>
    cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [cart]);

  const fetchShippingRates = () => {
    if (!formData.name || !formData.city || !formData.zip) {
      alert("Please fill in all required fields.");
      return;
    }

    // Directly set mockShippingRates as the available options
    setShippingOptions(mockShippingRates);
  };

  const handlePlaceOrder = () => {
    if (!selectedShipping) {
      alert("Please select a shipping option.");
      return;
    }

    const shippingMethod = shippingOptions.find((option) => option.id === selectedShipping);
    const totalWithShipping = totalPrice + (shippingMethod?.rate || 0);

    alert(`Order placed successfully! Total: $${totalWithShipping.toFixed(2)}`);
    setIsOrderPlaced(true);
    clearCart();
  };

  if (isOrderPlaced) {
    return (
      <div className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-green-600 mb-6">Thank You for Your Order!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your order has been placed successfully. You will receive a confirmation email shortly.
        </p>
        <Link
          href="/Shop"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-center mb-12">Checkout</h1>
      {cart.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 text-lg">Your cart is empty.</p>
          <Link
            href="/Shop"
            className="mt-6 inline-block px-8 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div>
          <div className="grid gap-6 mb-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-gray-50"
              >
                <div>
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="text-gray-600">Price: ${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateCart(item.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <p className="text-gray-700 font-semibold">{item.quantity}</p>
                    <button
                      onClick={() => updateCart(item.id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold">
                    ${Number(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            className="grid gap-4 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              fetchShippingRates();
            }}
          >
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="p-3 border rounded"
            />
            <input
              type="text"
              placeholder="ZIP Code"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="p-3 border rounded"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
            >
              Calculate Shipping
            </button>
          </form>

          {shippingOptions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Select a Shipping Method</h3>
              <ul className="space-y-4">
                {shippingOptions.map((option) => (
                  <li key={option.id} className="flex justify-between items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipping"
                        value={option.id}
                        onChange={() => setSelectedShipping(option.id)}
                        className="accent-blue-600"
                      />
                      {option.description} (${option.rate.toFixed(2)})
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">
              Total: $
              {(
                totalPrice +
                (shippingOptions.find((opt) => opt.id === selectedShipping)?.rate || 0)
              ).toFixed(2)}
            </h2>
            <button
              onClick={handlePlaceOrder}
              className={`px-10 py-4 bg-green-600 text-white rounded-lg shadow ${
                selectedShipping ? "hover:bg-green-700" : "opacity-50 cursor-not-allowed"
              } transition-all`}
              disabled={!selectedShipping}
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
