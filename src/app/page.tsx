"use client";
import React, { useEffect, useState } from "react";
import HeroSection from "../../components/HeroSection";
import ProductCard from "../../components/ProductCard";
import { fetchProducts } from "../app/api/productAPI";
import { useCart } from "../context/CartContext";
import Slider from "react-slick";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

const HomePage = () => {
  const categories: Array<{ name: string; query: string; image: string }> = [
    { name: "Men & Women", query: "Men%20&%20Women", image: "/men-women-category.png" },
    { name: "Accessories", query: "Accessories", image: "/accessories-category.jpg" },
    { name: "Electronics", query: "Electronics", image: "/electronics-category.jpg" },
  ];

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { addToCart, cart } = useCart();

  const reviews = [
    { id: 1, name: "John Doe", text: "Great product, highly recommend!" },
    { id: 2, name: "Jane Smith", text: "Amazing quality and fast delivery." },
    { id: 3, name: "Bob Williams", text: "Will buy from here again." },
    { id: 4, name: "Eva Davis", text: "Best purchase I've made in a long time." },
  ];

  const brands = ["/brands1.png", "/brands2.png", "/brands3.png", "/brands4.png", "/brands5.png", "/brands6.png"];

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const products = await fetchProducts();
        const featured = products.slice(0, 6);
        setFeaturedProducts(featured);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const isProductInCart = (productId: number) => 
    cart.some((item) => item.id === productId.toString());

  // Carousel settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2200,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 360, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Section */}
      <section className="py-8 bg-gray-50 px-4 sm:px-6 md:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">Shop by Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-screen-lg mx-auto">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/Shop`}
              className="relative bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transform transition duration-300 ease-in-out"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-40 sm:h-48 md:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 z-10 transform transition-all duration-300 hover:scale-125">
                  {category.name}
                </h3>
                <span className="mt-2 bg-blue-500 text-white text-xs sm:text-sm px-3 py-1 rounded z-10 transform transition-all duration-300 hover:scale-125 hover:shadow-lg">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <h2 className="text-3xl font-semibold text-center mb-8">Featured Products</h2>
        {featuredProducts.length > 0 ? (
          <Slider {...settings}>
            {featuredProducts.map((product) => (
              <div key={product.id} className="flex justify-center items-stretch">
                <ProductCard
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
              </div>
            ))}
          </Slider>
        ) : (
          <p className="text-center text-gray-500">Loading featured products...</p>
        )}
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-white">
        <h2 className="text-3xl font-semibold text-center mb-8">Customer Reviews</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="w-80 p-8 border rounded-lg shadow-lg bg-gray-50"
            >
              <p className="italic text-gray-700">"{review.text}"</p>
              <p className="mt-4 text-right text-gray-900 font-medium">- {review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20 bg-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-10">Our Trusted Partners</h2>
        <div className="flex justify-center flex-wrap gap-8">
          {brands.map((brand, index) => (
            <img
              key={index}
              src={brand}
              alt={`Brand ${index + 1}`}
              className="w-28 h-auto transition-transform transform hover:scale-110"
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
