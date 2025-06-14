// src/app/Login/page.tsx (or your login route)
"use client";
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Use Next.js Link for internal navigation
import validator from "validator";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle, UserPlus } from "lucide-react"; // Using Lucide icons

// If you prefer FontAwesome, uncomment this and comment out lucide-react import
// import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
// import { FcGoogle } from "react-icons/fc"; // For Google icon example
// import { FaFacebook } from "react-icons/fa"; // For Facebook icon example


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- Frontend Validation ---
    if (!validator.isEmail(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (validator.isEmpty(password)) {
        setError("Password cannot be empty.");
        setLoading(false);
        return;
    }
    if (!validator.isLength(password, { min: 6 })) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    // Sanitize inputs (basic example, more robust sanitization might be needed depending on backend)
    const sanitizedEmail = validator.normalizeEmail(email) || ""; // Ensure it's not null
    // Password sanitization is tricky. Escaping might not be what you want for a password
    // that will be hashed. Usually, you send the raw password over HTTPS.
    // For this mock, we'll just use the raw password.
    const rawPassword = password;

    try {
      // --- Mock Authentication Logic ---
      // In a real app, this would be an API call to your backend:
      // const response = await axios.post('/api/auth/login', { email: sanitizedEmail, password: rawPassword, rememberMe });
      // if (response.data.success) {
      //   // Handle successful login (e.g., store token, redirect)
      //   router.push("/"); // Redirect to dashboard or home
      // } else {
      //   setError(response.data.message || "Invalid credentials.");
      // }
      console.log("Attempting login with:", { email: sanitizedEmail, password: rawPassword, rememberMe });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Mock success/failure
      if (sanitizedEmail === "test@example.com" && rawPassword === "password123") {
        console.log("Mock login successful!");
        // Here you would typically set user session/token
        router.push("/"); // Redirect to home or dashboard
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 shadow-xl rounded-lg border border-slate-200">
        <div className="text-center mb-6 sm:mb-8">
          {/* You can add a logo here if you have one */}
          {/* <img src="/logo.png" alt="Company Logo" className="mx-auto h-12 w-auto mb-4" /> */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Welcome Back!</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue to your account.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 sm:p-4 rounded-md mb-4 sm:mb-6 text-sm flex items-start" role="alert">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="email-error"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="password-error"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-indigo-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-900 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-700">
                Remember me
              </label>
            </div>
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 text-white bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : <LogIn size={20} className="mr-2" />}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3"> 
            <button // Example Google login button
              type="button"
              onClick={() => console.log("Login with Google clicked")} // Replace with actual Google login handler
              className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600 mt-8">
          Don't have an account?{" "}
          <Link href="/Register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;