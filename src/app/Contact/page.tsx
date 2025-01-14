"use client";

import React, { useState } from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaTwitter, FaLinkedin } from "react-icons/fa";
import validator from "validator";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!validator.isAlpha(formData.name.replace(/ /g, ""), "en-US")) {
      setError("Name must only contain letters and spaces.");
      return;
    }

    if (!validator.isEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (validator.isEmpty(formData.message)) {
      setError("Message cannot be empty.");
      return;
    }

    // Simulate form submission
    alert("Message sent successfully!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/contact-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white shadow-lg rounded-lg max-w-5xl w-full mx-4 mt-10 mb-80">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Contact Information */}
            <div className="p-8 bg-blue-800 text-white rounded-l-lg">
              <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
              <p className="text-lg mb-6">
                We’d love to hear from you! Reach out to us using the information below or fill out the form.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaMapMarkerAlt size={20} className="mr-3" />
                  <span>123 Main Street, City, Country</span>
                </div>
                <div className="flex items-center">
                  <FaPhone size={20} className="mr-3" />
                  <span>+123 456 7890</span>
                </div>
                <div className="flex items-center">
                  <FaEnvelope size={20} className="mr-3" />
                  <span>contact@company.com</span>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-200 transition"
                  title="Follow us on Facebook"
                >
                  <FaFacebook size={28} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-200 transition"
                  title="Follow us on Twitter"
                >
                  <FaTwitter size={28} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-200 transition"
                  title="Follow us on LinkedIn"
                >
                  <FaLinkedin size={28} />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    placeholder="Your Full Name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    placeholder="Your Email Address"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    placeholder="Your Message"
                    required
                  ></textarea>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-800 text-white rounded-md hover:bg-blue-600 transition-all duration-200 shadow-lg"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
