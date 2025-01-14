"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import validator from "validator";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate inputs
    if (!validator.isAlpha(name.replace(/ /g, ""), "en-US")) {
      setError("Name can only contain letters and spaces.");
      setLoading(false);
      return;
    }

    if (!validator.isEmail(email)) {
      setError("Invalid email address.");
      setLoading(false);
      return;
    }

    if (!validator.isStrongPassword(password, { minLength: 6 })) {
      setError("Password must be at least 6 characters long and include numbers and symbols.");
      setLoading(false);
      return;
    }

    // Sanitize inputs
    const sanitizedName = validator.trim(name);
    const sanitizedEmail = validator.normalizeEmail(email) as string;
    const sanitizedPassword = validator.escape(password);

    try {
      // Mock registration logic
      console.log("Registering with:", { sanitizedName, sanitizedEmail, sanitizedPassword });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-md border border-blue-800">
        <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
              required
            />
          </div>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white bg-blue-800 rounded-md hover:bg-blue-800 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <a href="/Login" className="text-blue-800 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
