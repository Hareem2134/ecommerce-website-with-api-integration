// src/app/Register/page.tsx (or your register route)
"use client";
import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Use Next.js Link
import validator from "validator";
import { User, Mail, Lock, Eye, EyeOff, CheckSquare, Square, UserPlus, Loader2, AlertCircle, LogIn } from "lucide-react";

// If you prefer FontAwesome, uncomment this and comment out lucide-react import
// import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: "", color: "text-slate-500" });

  const router = useRouter();

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    let message = "";
    let color = "text-slate-500";

    if (!pass) {
        setPasswordStrength({ score: 0, message: "", color: "text-slate-500" });
        return;
    }
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++; // Bonus for longer
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++; // number
    if (/[^A-Za-z0-9]/.test(pass)) score++; // symbol

    if (pass.length < 8) {
        message = "Too short (min 8 chars)";
        color = "text-red-500";
    } else if (score < 3) {
        message = "Weak";
        color = "text-orange-500";
    } else if (score < 5) {
        message = "Okay";
        color = "text-yellow-500";
    } else if (score < 6) {
        message = "Good";
        color = "text-lime-500";
    } else {
        message = "Strong";
        color = "text-green-500";
    }
    setPasswordStrength({ score, message, color });
  };

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- Frontend Validation ---
    if (!validator.isAlpha(name.replace(/\s/g, ""), "en-US", {ignore: "'-"})) {
      setError("Name should only contain letters and spaces.");
      setLoading(false);
      return;
    }
    if (validator.isEmpty(name.trim())) {
      setError("Name cannot be empty.");
      setLoading(false);
      return;
    }
    if (!validator.isEmail(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    // Using validator.isStrongPassword for more robust check
    // Customize options as needed. Default requires: minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
    if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, and a number. Symbols are optional but recommended.");
      setLoading(false);
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions to register.");
      setLoading(false);
      return;
    }

    const sanitizedName = validator.escape(validator.trim(name));
    const sanitizedEmail = validator.normalizeEmail(email) || "";
    // Do NOT sanitize/escape password on client-side before sending for hashing
    const rawPassword = password;

    try {
      // --- Mock Registration Logic ---
      // In a real app, this would be an API call to your backend:
      // const response = await axios.post('/api/auth/register', { name: sanitizedName, email: sanitizedEmail, password: rawPassword });
      // if (response.data.success) {
      //   router.push("/login?registered=true"); // Redirect to login with a success message
      // } else {
      //   setError(response.data.message || "Registration failed. Email might already be in use.");
      // }
      console.log("Attempting registration with:", { name: sanitizedName, email: sanitizedEmail, password: rawPassword, agreedToTerms });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Mock success (in a real app, the backend would handle email uniqueness etc.)
      console.log("Mock registration successful!");
      router.push("/Login?status=registered_successfully"); // Redirect to login page

    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "An unexpected error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 shadow-xl rounded-lg border border-slate-200">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join us! It's quick and easy.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 sm:p-4 rounded-md mb-4 sm:mb-6 text-sm flex items-start" role="alert">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                id="name"
                name="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 pl-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="name-error"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email-register" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                id="email-register" // Unique ID
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="email-register-error"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password-register" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password-register" // Unique ID
                name="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="password-register-error password-strength-feedback"
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
            {password && (
                <div className="mt-1.5 flex items-center text-xs">
                    <span className="mr-2">Strength:</span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${
                                passwordStrength.score === 0 ? 'w-0' :
                                passwordStrength.score === 1 ? 'w-1/6 bg-red-500' :
                                passwordStrength.score === 2 ? 'w-2/6 bg-orange-500' :
                                passwordStrength.score === 3 ? 'w-3/6 bg-yellow-500' :
                                passwordStrength.score === 4 ? 'w-4/6 bg-lime-500' :
                                passwordStrength.score >= 5 ? 'w-full bg-green-500' : ''
                            }`}
                        ></div>
                    </div>
                    <span className={`ml-2 whitespace-nowrap ${passwordStrength.color}`}>{passwordStrength.message}</span>
                </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
                aria-describedby="confirm-password-error"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-indigo-600 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-conditions"
                  name="terms-conditions"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-indigo-900 border-slate-300 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-conditions" className="font-medium text-slate-700">
                  I agree to the{" "}
                  <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 hover:underline">
                    Terms and Conditions
                  </Link>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full flex items-center justify-center py-3 px-4 text-white bg-indigo-600 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : <UserPlus size={20} className="mr-2" />}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-8">
          Already have an account?{" "}
          <Link href="/Login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline flex items-center justify-center sm:inline-block">
            <LogIn size={16} className="mr-1 sm:hidden" /> Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;