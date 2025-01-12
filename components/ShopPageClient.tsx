"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../src/context/CartContext";

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
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);

  const { addToCart, cart } = useCart();
  const categories = ["All", "Fashion", "Accessories", "Electronics"];

  useEffect(() => {
    filterProducts(products, selectedCategory, priceRange);
  }, [products, selectedCategory, priceRange]);

  const filterProducts = (allProducts: SanityProduct[], category: string, range: number[]) => {
    let filtered = allProducts;

    if (category !== "All") {
      filtered = filtered.filter((product) =>
        typeof product.category !== "string" && product.category?.title === category
      );
    }

    filtered = filtered.filter((product) => product.price >= range[0] && product.price <= range[1]);
    setFilteredProducts(filtered);
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    params.set("category", category);
    router.push(`/Shop?${params.toString()}`);
  };

  const isProductInCart = (productId: string) =>
    cart.some((item) => item.id === productId);

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="w-full md:w-1/4 bg-gray-100 p-4">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Category</h3>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <button
                  className={`px-3 py-2 rounded ${
                    selectedCategory === category
                      ? "bg-blue-800 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
          <h3 className="text-lg font-medium mb-2">Price Range</h3>
          <div className="flex items-center space-x-2">
            <span className="text-gray-700">${priceRange[0]}</span>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[0]}
              className="flex-grow"
              onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
            />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-gray-700">${priceRange[1]}</span>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[1]}
              className="flex-grow"
              onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
            />
          </div>
        </div>
      </aside>
      <main className="w-full md:w-3/4 p-4 mb-96">
        <h1 className="text-2xl font-semibold mb-6">Products</h1>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="border p-4 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover mb-4"
                />

                <Link href={`/products/${product.slug.current}`}>
                  <h2 className="text-lg font-semibold text-blue-800 hover:underline cursor-pointer mb-2">
                    {product.name}
                  </h2>
                </Link>

                <p className="text-sm text-gray-700 mb-2">
                  {product.description.slice(0, 100)}...
                </p>
                <p className={`text-sm ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </p>
                <p className="font-bold text-gray-900">${product.price}</p>
                <p className="text-sm text-gray-500">
                  Category:{" "}
                  {typeof product.category === "string"
                    ? product.category
                    : product.category?.title || "Unknown"}
                </p>
                {isProductInCart(product._id) ? (
                  <Link href="/Cart">
                    <button className="px-4 py-2 bg-green-500 text-white rounded mt-4 w-full transition-all hover:bg-green-600">
                      Go to Cart
                    </button>
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
                      })
                    }
                    className="px-4 py-2 bg-blue-800 text-white rounded mt-4 w-full transition-all hover:bg-blue-600"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found for the selected filters.</p>
        )}
      </main>
    </div>
  );
}
