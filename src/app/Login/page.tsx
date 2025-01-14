"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock } from "react-icons/fa";
import validator from "validator";

const Login = () => {
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
    if (!validator.isEmail(email)) {
      setError("Invalid email address.");
      setLoading(false);
      return;
    }

    if (!validator.isLength(password, { min: 6 })) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(email) as string;
    const sanitizedPassword = validator.escape(password);

    try {
      // Mock authentication logic
      console.log("Logging in with:", { sanitizedEmail, sanitizedPassword });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-md border border-blue-800">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <a href="/Register" className="text-blue-800 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
