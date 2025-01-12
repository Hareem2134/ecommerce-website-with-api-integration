import React from "react";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void; // Optional if actionButton is used
  actionButton?: React.ReactNode; // Custom action button
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, actionButton }) => {
  return (
    <div className="relative group flex flex-col justify-between items-center h-[500px] border rounded-lg p-4 shadow-lg bg-white hover:shadow-2xl hover:border-blue-800 transition-all duration-300">
      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="cursor-pointer w-full">
        <div className="relative overflow-hidden rounded-md mb-4">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-40 object-contain transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
        </div>
      </Link>

      {/* Product Title */}
      <Link href={`/products/${product.id}`} className="cursor-pointer">
        <h3 className="font-bold text-center text-lg mb-2 text-gray-800 transition-colors duration-300 group-hover:text-blue-800">
          {product.title}
        </h3>
      </Link>

      {/* Short Description */}
      <p className="text-gray-600 text-sm text-center mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
        {product.description}
      </p>

      {/* Product Category */}
      <p className="text-gray-500 text-sm mb-1 group-hover:text-gray-700 transition-colors duration-300">
        Category: <span className="font-medium">{product.category}</span>
      </p>

      {/* Stock Status with Animated Effect */}
      <p
        className={`text-sm mb-2 px-2 py-1 rounded-full transition-transform duration-300 ${
          product.inStock
            ? "bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white group-hover:scale-105 shadow"
            : "bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white group-hover:scale-105 shadow"
        }`}
      >
        {product.inStock ? "In Stock" : "Out of Stock"}
      </p>

      {/* Product Price */}
      <p className="text-blue-800 font-bold text-xl mb-4 group-hover:text-blue-600 transition-colors duration-300">
        ${product.price.toFixed(2)}
      </p>

      {/* Action Button with Animated Effect */}
      <div className="w-full">
        {actionButton ? (
          actionButton
        ) : (
          <button
            className="bg-blue-900 text-white w-full py-2 rounded-lg transform transition-all duration-300 hover:scale-110 hover:bg-gradient-to-r hover:from-blue-800 hover:to-blue-700 hover:shadow-lg"
            onClick={() => {
              console.log("Adding product to cart:", product); // Debugging
              if (onAddToCart) onAddToCart();
            }}
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Hover Animation Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-400 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg"></div>
    </div>
  );
};

export default ProductCard;
