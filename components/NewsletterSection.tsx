import React, { useState } from "react";
import validator from "validator";

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState(""); // State for email input
  const [error, setError] = useState(""); // State for error messages

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    setError(""); // Clear any previous errors

    // Validate the email address
    if (!validator.isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Sanitize the email
    const sanitizedEmail = validator.normalizeEmail(email) as string;

    // Simulate API subscription
    console.log("Subscribed with email:", sanitizedEmail);
    alert(`Subscribed with email: ${sanitizedEmail}`);
    setEmail(""); // Reset the email input field
  };

  return (
    <section className="py-16 bg-gray-200 px-4 sm:px-6 md:px-8">
      <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800 transition-transform duration-300 hover:text-blue-800 hover:scale-105">
        Stay Updated
      </h2>
      <p className="text-center text-gray-700 mb-6">
        Subscribe to our newsletter to receive the latest news and exclusive offers!
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-800"
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            className="bg-blue-800 text-white px-6 rounded-r-md hover:bg-blue-700"
          >
            Subscribe
          </button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>
    </section>
  );
};

export default NewsletterSection;
