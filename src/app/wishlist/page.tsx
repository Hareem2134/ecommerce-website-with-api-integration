// app/wishlist/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext'; // For "Add to Cart" functionality
import { Heart, ShoppingCart, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, isWishlisted } = useWishlist();
  const { addToCart: addItemToCart, cart } = useCart(); // Renamed to avoid conflict if needed

  const isProductInCart = (productId: string) => cart.some(item => item.id === productId);

  const handleAddToCartFromWishlist = (item: import('@/context/WishlistContext').WishlistItem) => {
    addItemToCart({
        id: item._id,
        title: item.name,
        price: item.price,
        image: item.imageUrl,
        quantity: 1,
        slug: ''
    });
    // Optionally remove from wishlist after adding to cart
    // removeFromWishlist(item._id);
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-gray-600 flex items-center space-x-1.5">
          <Link href="/" className="hover:text-blue-600 hover:underline">Home</Link>
          <ChevronRight size={14} className="text-gray-500" />
          <span className="font-medium text-gray-800">My Wishlist</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center sm:text-left">
          My Wishlist <Heart className="inline-block text-red-500 ml-2" size={30} fill="currentColor"/>
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-lg shadow-xl">
            <AlertTriangle className="mx-auto text-yellow-500 mb-4 h-16 w-16" />
            <p className="text-xl text-gray-700 mb-3">Your wishlist is currently empty.</p>
            <p className="text-gray-500 mb-6">Looks like you haven't added any products to your wishlist yet. Start exploring and save your favorites!</p>
            <Link href="/Shop" legacyBehavior>
              <a className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md hover:shadow-lg">
                Explore Products
              </a>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
                <Link href={`/products/${item.slug}`} className="block group">
                  <div className="relative aspect-square">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                    />
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1 truncate group-hover:text-blue-600">
                    <Link href={`/products/${item.slug}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="text-xl font-bold text-blue-600 mb-3">${item.price.toFixed(2)}</p>

                  <div className="mt-auto space-y-3">
                    {isProductInCart(item._id) ? (
                        <Link href="/Cart" className="w-full flex items-center justify-center bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm">
                            <ShoppingCart size={18} className="mr-2"/> View in Cart
                        </Link>
                    ) : (
                        <button
                            onClick={() => handleAddToCartFromWishlist(item)}
                            className="w-full flex items-center justify-center bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            <ShoppingCart size={18} className="mr-2"/> Add to Cart
                        </button>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item._id)}
                      className="w-full flex items-center justify-center text-red-500 hover:text-red-700 border border-red-500 hover:bg-red-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      aria-label="Remove from Wishlist"
                    >
                      <Trash2 size={18} className="mr-2" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;