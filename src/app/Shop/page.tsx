"use client";
import React, { useState, useEffect, Suspense } from "react";
import { fetchProducts } from "../../app/api/productAPI";
import ProductCard from "../../../components/ProductCard";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

const ShopPage = () => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);

  const { addToCart, cart } = useCart();
  const categories = ["All", "Men & Women", "Accessories", "Electronics"];

  // Only run this on the client side to fetch searchParams
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    if (!searchParams) return;

    const preselectedCategory = decodeURIComponent(searchParams.get("category") || "All");
    setSelectedCategory(preselectedCategory);

    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await fetchProducts();
        setProducts(allProducts);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [searchParams]);

  useEffect(() => {
    filterProducts(products, selectedCategory, priceRange);
  }, [selectedCategory, priceRange, products]);

  const filterProducts = (allProducts: Product[], category: string, range: number[]) => {
    let filtered = allProducts;
    if (category !== "All") {
      filtered = filtered.filter((product) => product.category === category);
    }
    filtered = filtered.filter((product) => product.price >= range[0] && product.price <= range[1]);
    setFilteredProducts(filtered);
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategory(category);
  };

  const isProductInCart = (productId: number) =>
    cart.some((item) => item.id === productId.toString());

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
                      ? "bg-blue-500 text-white"
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
      <main className="w-full md:w-3/4 p-4">
        <h1 className="text-2xl font-semibold mb-6">Products</h1>
        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                actionButton={
                  isProductInCart(product.id) ? (
                    <Link
                      href="/Cart"
                      className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-all"
                    >
                      Go to Cart
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        addToCart({
                          id: product.id.toString(),
                          title: product.title,
                          price: product.price,
                          image: product.image,
                          quantity: 1,
                        })
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-all"
                    >
                      Add to Cart
                    </button>
                  )
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found for the selected filters.</p>
        )}
      </main>
    </div>
  );
};

export default ShopPage;
