import React from "react";
import Link from "next/link";

// Interface aligned with SanityProduct structure for easier use
export interface ProductCardProduct {
  _id: string;
  name: string;
  slug: { current: string };
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  category: { _id?: string; title: string } | string; // Support both object and string category
}

interface ProductCardProps {
  product: ProductCardProduct;
  actionButton?: React.ReactNode; // For "Add to Cart" or "Go to Cart"
}

const ProductCard: React.FC<ProductCardProps> = ({ product, actionButton }) => {
  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.title || "N/A";

  return (
    <div className="relative group flex flex-col justify-between border rounded-lg p-4 shadow-lg bg-white hover:shadow-xl transition-all duration-300 overflow-hidden min-h-[480px]">
      {/* Product Image */}
      <Link href={`/products/${product.slug.current}`} className="cursor-pointer w-full block">
        <div className="relative overflow-hidden rounded-md mb-4 aspect-square"> {/* Use aspect-square for consistent image proportions */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Optional: Image overlay effect
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
          */}
        </div>
      </Link>

      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Product Title */}
          <Link href={`/products/${product.slug.current}`} className="cursor-pointer">
            <h3 className="font-semibold text-lg mb-2 text-gray-800 transition-colors duration-300 group-hover:text-blue-600 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">
            {product.description}
          </p>
        </div>

        <div>
          {/* Product Category */}
          <p className="text-gray-500 text-xs mb-1 group-hover:text-gray-700 transition-colors duration-300">
            Category: <span className="font-medium">{categoryName}</span>
          </p>

          {/* Stock Status */}
          <p
            className={`text-xs font-semibold mb-2 py-0.5 px-1.5 inline-block rounded-md ${
              product.inStock
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>

          {/* Product Price */}
          <p className="text-blue-700 font-bold text-xl mb-3 group-hover:text-blue-500 transition-colors duration-300">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>


      {/* Action Button */}
      <div className="w-full mt-auto">
        {actionButton}
      </div>

      {/* Subtle decorative element (optional) */}
      {/* <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-500 group-hover:w-full transition-all duration-500 rounded-bl-lg"></div> */}
    </div>
  );
};

export default ProductCard;