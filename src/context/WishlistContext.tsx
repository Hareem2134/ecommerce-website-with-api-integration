"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of a wishlist item
export interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: string; // For linking back to the product page
}

// Define the context type
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

// Create the context with a default undefined value
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Create the provider component
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const storedWishlist = localStorage.getItem('wishlist');
      return storedWishlist ? JSON.parse(storedWishlist) : [];
    }
    return [];
  });

  // Effect to update localStorage when wishlistItems change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems]);

  const addToWishlist = (product: WishlistItem) => {
    setWishlistItems((prevItems) => {
      if (!prevItems.find(item => item._id === product._id)) {
        // console.log("Adding to wishlist:", product); // For debugging
        return [...prevItems, product];
      }
      return prevItems; // Already in wishlist
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems((prevItems) => {
      // console.log("Removing from wishlist, ID:", productId); // For debugging
      return prevItems.filter(item => item._id !== productId);
    });
  };

  const isWishlisted = (productId: string): boolean => {
    return wishlistItems.some(item => item._id === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  }

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use the WishlistContext
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};