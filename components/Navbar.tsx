"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBars, FaTimes, FaShoppingCart, FaUser } from "react-icons/fa";
import router from "next/router";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <nav className="bg-blue-500 text-white relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Hamburger Icon (Left on Smaller Screens) */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 lg:ml-4">
            <Link href="/" className="text-xl font-bold">
              MyShop
            </Link>
          </div>

          {/* Main Navigation Links (Hidden in Mobile View) */}
          <div
            className={`absolute top-16 left-0 w-full bg-blue-500 lg:static lg:flex lg:w-auto ${
              isMenuOpen ? "block" : "hidden"
            }`}
          >
            <div className="flex flex-col lg:flex-row items-center lg:space-x-6">
              <Link
                href="/"
                className="block mt-2 lg:mt-0 px-3 py-2 rounded hover:bg-blue-600"
              >
                Home
              </Link>
              <Link
                href="/Shop"
                className="block mt-2 lg:mt-0 px-3 py-2 rounded hover:bg-blue-600"
              >
                Shop
              </Link>
              <Link
                href="/Contact"
                className="block mt-2 lg:mt-0 px-3 py-2 rounded hover:bg-blue-600"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Cart and User Section (Always on Right) */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              href="/Cart"
              className="flex items-center px-3 py-2 rounded hover:bg-blue-600"
            >
              <FaShoppingCart size={20} className="mr-2" />
            </Link>

            {/* User Icon with Dropdown */}
            <div
              className="relative"
              ref={dropdownRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <button className="flex items-center px-3 py-2 rounded hover:bg-blue-600">
                <FaUser size={20} className="mr-2" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg z-50">
                  <Link
                    href="/Login"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/Register"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Register
                  </Link>
                  <Link
                    href="/Checkout"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/Logout"
                    className="block px-4 py-2 text-left w-full hover:bg-gray-100"
                  >
                    Logout
                  </Link>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
