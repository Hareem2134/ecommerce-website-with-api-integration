"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProductBySlug } from "@/app/api/productAPI";
import { useCart } from "@/context/CartContext";

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  inStock: boolean;
}

const ProductDetailsPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  
  // Extract slug and ensure it's a string
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params.slug;

  const { addToCart } = useCart();

  useEffect(() => {
    if (!slug) {
      setError("Product not found.");
      return;
    }

    const fetchProduct = async () => {
      try {
        const fetchedProduct = await fetchProductBySlug(slug);
        setProduct(fetchedProduct);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product details.");
      }
    };

    fetchProduct();
  }, [slug]);

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!product) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full object-cover rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-2">Category: {product.category}</p>
          <p className="text-xl font-semibold mb-4">${product.price}</p>
          <p className={`text-sm ${product.inStock ? "text-green-600" : "text-red-600"} mb-4`}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>
          <p className="text-gray-700 mb-4">{product.description}</p>
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
            className="bg-blue-500 text-white py-2 px-4 rounded transform transition-all duration-300 hover:scale-110 hover:shadow-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
