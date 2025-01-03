"use client"
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProductById } from "../../api/productAPI";
import { useCart } from "../../../context/CartContext";

// Define the type for the product
interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

const ProductDetailsPage = () => {
  const [product, setProduct] = useState<Product | null>(null); // Explicitly define the type
  const { addToCart } = useCart();
  const params = useParams();
  const id = params.slug;

  useEffect(() => {
    if (id) {
      fetchProductById(Number(id)).then(setProduct);
    }
  }, [id]);

  if (!product) {
    return <div>Loading...</div>;
  }

  const handleAddToCart = () => {
    console.log("Adding product to cart:", product); // Debugging log
    addToCart({
      id: product.id.toString(),
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <img
            src={product.image}
            alt={product.title}
            className="w-full object-cover rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">{product.title}</h1>
          <p className="text-gray-600 mb-2">Category: {product.category}</p>
          <p className="text-xl font-semibold mb-4">${product.price}</p>
          <p className="text-gray-700 mb-4">{product.description}</p>
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
