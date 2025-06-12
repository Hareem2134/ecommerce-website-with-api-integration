"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../src/context/CartContext";
import ProductCard, { ProductCardProduct } from "./ProductCard"; // Import ProductCard and its product type

interface SanityProduct {
  _id: string;
  name: string;
  slug: { current: string };
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  category: {
    _id: string;
    title: string;
  } | string;
}

export default function ShopPageClient({
  initialProducts,
}: {
  initialProducts: SanityProduct[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<SanityProduct[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<SanityProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]); // Assuming max price is 1000 for slider

  const { addToCart, cart } = useCart();
  const categories = ["All", "Fashion", "Accessories", "Electronics"]; // Example categories

  useEffect(() => {
    // Initialize products on mount or when initialProducts change
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    filterProducts(products, selectedCategory, priceRange);
  }, [products, selectedCategory, priceRange]);

  const filterProducts = (allProducts: SanityProduct[], category: string, range: number[]) => {
    let filtered = allProducts;

    if (category !== "All") {
      filtered = filtered.filter((product) => {
        const productCategoryName = typeof product.category === 'string' ? product.category : product.category?.title;
        return productCategoryName === category;
      });
    }

    filtered = filtered.filter(
      (product) => product.price >= range[0] && product.price <= range[1]
    );
    setFilteredProducts(filtered);
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(window.location.search); // Preserve existing params
    params.set("category", category);
    router.push(`/Shop?${params.toString()}`);
  };
  
  const handlePriceRangeChange = (index: number, value: number) => {
    const newRange = [...priceRange] as [number, number];
    newRange[index] = value;
    if (newRange[0] > newRange[1]) { // Ensure min is not greater than max
      if (index === 0) newRange[0] = newRange[1];
      else newRange[1] = newRange[0];
    }
    setPriceRange(newRange);
  };


  const isProductInCart = (productId: string) =>
    cart.some((item) => item.id === productId);

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      <aside className="w-full md:w-1/4 bg-white p-6 shadow-md md:sticky md:top-0 md:h-screen overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Filters</h2>
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Category</h3>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <button
                  className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                  onClick={() => handleCategorySelection(category)}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">Price Range</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000" // Adjust max based on your product prices
              value={priceRange[0]}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              onChange={(e) => handlePriceRangeChange(0, +e.target.value)}
            />
            <input
              type="range"
              min="0"
              max="1000" // Adjust max based on your product prices
              value={priceRange[1]}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              onChange={(e) => handlePriceRangeChange(1, +e.target.value)}
            />
          </div>
        </div>
      </aside>
      <main className="w-full md:w-3/4 p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
          {selectedCategory === "All" ? "All Products" : selectedCategory}
        </h1>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product as ProductCardProduct} // Assert type
                actionButton={
                  isProductInCart(product._id) ? (
                    <Link href="/Cart" legacyBehavior>
                      <a className="block w-full text-center px-4 py-2.5 bg-green-600 text-white rounded-md font-semibold transition-all hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                        Go to Cart
                      </a>
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        addToCart({
                          id: product._id,
                          title: product.name,
                          price: product.price,
                          image: product.imageUrl,
                          quantity: 1,
                          slug: ""
                        })
                      }
                      disabled={!product.inStock}
                      className={`w-full px-4 py-2.5 bg-blue-600 text-white rounded-md font-semibold transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                        !product.inStock ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No products matched your current filters. Try adjusting them.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}