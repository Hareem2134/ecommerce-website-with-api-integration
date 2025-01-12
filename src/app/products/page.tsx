"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts } from "@/app/api/productAPI"; // Correct path to fetch function

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: { current: string };
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again later.");
      }
    };

    fetchAllProducts();
  }, []);

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {products.map((product) => (
        <div
          key={product._id}
          className="border p-4 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
        <Link href={`/products/${product.slug.current}`}>
          <h2 className="text-lg font-semibold text-blue-800 hover:underline cursor-pointer mb-2">
            {product.name}
          </h2>
        </Link>

          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover mb-4"
          />
          <p className="font-bold text-gray-900">${product.price}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductsPage;
