"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      // Simulate logout logic
      setTimeout(() => {
        // Clear session or token here if applicable
        router.push("/Login");
      }, 2000); // Simulate a brief delay for user experience
    } catch (e) {
      setError("An error occurred during logout. Please try again.");
    }
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Logging out...</h1>
        <p className="text-gray-600">We are logging you out. Please wait.</p>
        <div className="mt-6">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default Logout;
