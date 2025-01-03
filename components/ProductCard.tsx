import React from "react";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void; // Optional if actionButton is used
  actionButton?: React.ReactNode; // Custom action button
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, actionButton }) => {
  return (
    <div className="flex flex-col justify-between items-center h-[400px] border rounded-lg p-4 shadow bg-white hover:shadow-lg transition-shadow">
      {/* Clickable Product Image */}
      <Link href={`/products/${product.id}`} className="cursor-pointer w-full">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-40 object-contain rounded-md mb-4 hover:opacity-90 transition-opacity"
        />
      </Link>

      {/* Clickable Product Title */}
      <Link href={`/products/${product.id}`} className="cursor-pointer">
        <h3 className="font-semibold text-center text-lg mb-2 hover:underline">
          {product.title}
        </h3>
      </Link>

      {/* Product Price */}
      <p className="text-blue-500 font-medium text-xl">${product.price.toFixed(2)}</p>

      {/* Action Button or Default Add to Cart */}
      <div className="w-full mt-4">
        {actionButton ? (
          actionButton
        ) : (
          <button
            className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600 transition"
            onClick={() => {
              console.log("Adding product to cart:", product); // Debugging
              if (onAddToCart) onAddToCart();
            }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
