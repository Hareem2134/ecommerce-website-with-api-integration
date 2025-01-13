"use client";
import React, { useEffect, useState } from "react";
import HeroSection from "../../components/HeroSection";
import CountdownTimer from "../../components/CountdownTimer";
import { useCart } from "../context/CartContext";
import Slider from "react-slick";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import NewsletterSection from "../../components/NewsletterSection";


interface SanityProduct {
  _id: string;
  name: string;
  slug: { current: string };
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  tags: string[];
  category: {
    _id: string;
    title: string;
  } | string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  category: string;
  slug: { current: string };
}


const generateNumericId = (id: string): number =>
  parseInt(id.replace(/\D/g, "").slice(0, 6)) || Math.floor(Math.random() * 100000);


const HomePage: React.FC = () => {
  const categories = [
    { name: "Fashion", query: "Fashion-category", image: "/men-women-category.png" },
    { name: "Accessories", query: "Accessories-category", image: "/accessories-category.jpg" },
    { name: "Electronics", query: "Electronics-category", image: "/electronics-category.jpg" },
  ];

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const { addToCart, cart } = useCart();
  const [serverTargetTime, setServerTargetTime] = useState<number>(0);

  const reviews = [
    { id: 1, name: "John Doe", text: "Great product, highly recommend!" },
    { id: 2, name: "Jane Smith", text: "Amazing quality and fast delivery." },
    { id: 3, name: "Bob Williams", text: "Will buy from here again." },
    { id: 4, name: "Eva Davis", text: "Best purchase I've made in a long time." },
    { id: 5, name: "Michael Brown", text: "Excellent customer service and great quality products!" },
    { id: 6, name: "Anna Taylor", text: "The products are worth every penny, loved the experience!" },
  ];

  const brands = [
    "/brands1.png",
    "/brands2.png",
    "/brands3.png",
    "/brands4.png",
    "/brands5.png",
    "/brands6.png",
  ];
    
  useEffect(() => {
    // Calculate server target time dynamically
    setServerTargetTime(new Date().setHours(23, 59, 59, 999));

    const fetchProducts = async () => {
      try {
        const sanityProducts: SanityProduct[] = await client.fetch(`*[_type == "product"] {
          _id,
          name,
          slug,
          description,
          price,
          "imageUrl": image.asset->url,
          inStock,
          tags,
          category->{
            _id,
            title
          }
        }`);

        const normalizedProducts = sanityProducts.map((product) => ({
          id: generateNumericId(product._id),
          title: product.name,
          price: product.price,
          description: product.description,
          image: product.imageUrl,
          inStock: product.inStock,
          category: typeof product.category === "string" ? product.category : product.category?.title || "Unknown",
          slug: product.slug,
        }));

        setFeaturedProducts(normalizedProducts.slice(0, 6));
        setDeals(normalizedProducts.slice(6, 12)); // Simulating deals of the day
      } catch (error) {
        console.error("Failed to fetch products from Sanity:", error);
      }
    };

    fetchProducts();
  }, []);

  const isProductInCart = (productId: number) =>
    cart.some((item) => item.id === productId.toString());

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
      <section className="py-8 bg-gradient-to-b from-gray-50 to-gray-100 px-4 sm:px-6 md:px-8">
        <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800 transition-transform duration-300 hover:text-blue-800 hover:scale-105">Shop by Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-screen-lg mx-auto">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/Shop?category=${encodeURIComponent(category.name)}`}
              className="relative bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 group hover:shadow-2xl hover:scale-105 border border-blue-300 hover:border-blue-800"
>
              <div className="relative w-full h-48 sm:h-56 md:h-64">
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70 group-hover:opacity-90"></div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
                <h3 className="text-2xl font-bold text-white mb-3transform transition-all duration-300 group hover:text-blue-800 hover:shadow-2xl hover:scale-125">{category.name}</h3>
                <span className="mt-2 bg-blue-800 text-white text-sm sm:text-base px-4 py-2 rounded-full shadow-lg transform transition-all duration-300 group hover:shadow-2xl hover:scale-125">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="py-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-4xl font-semibold text-center mb-8 text-blue-800 transition-transform duration-300 hover:text-blue-900 hover:scale-105">Deals of the Day</h2>
          <div className="text-center mb-12">
            <p className="text-lg text-gray-700">Grab these exclusive deals before the timer runs out!</p>
            {serverTargetTime > 0 && <CountdownTimer serverTargetTime={serverTargetTime} />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="relative bg-white shadow-lg rounded-lg overflow-hidden border border-blue-300 hover:border-blue-800 transform transition-transform duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <Link href={`/products/${deal.slug?.current || ""}`}>
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deal.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-red-600">${deal.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 line-through">$59.99</p>
                    </div>
                    <button
                      onClick={() =>
                        addToCart({
                          id: deal.id.toString(),
                          title: deal.title,
                          price: deal.price,
                          image: deal.image,
                          quantity: 1,
                        })
                      }
                      className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8 bg-gradient-to-b from-blue-50 to-gray-50 px-4 sm:px-6 md:px-8">
        <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800 transition-transform duration-300 hover:text-blue-800 hover:scale-105">
          Featured Products
        </h2>
        {featuredProducts.length > 0 ? (
          <Slider {...settings}>
  {featuredProducts.map((product) => (
    <div key={product.id} className="p-4">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 border border-blue-300 hover:border-blue-800">
        <Link href={`/products/${product.slug.current}`} className="block">
          <div className="relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-t-lg">
              <p className="absolute bottom-2 left-2 text-white text-sm font-semibold">
                {product.category}
              </p>
            </div>
          </div>
        </Link>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {product.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-blue-800">
              ${product.price.toFixed(2)}
            </span>
            {isProductInCart(product.id) ? (
              <Link
                href="/Cart"
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-lg"
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
                className="px-4 py-2 bg-blue-800 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-lg"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ))}
</Slider>

        ) : (
          <p className="text-center text-gray-500 text-lg">Loading featured products...</p>
        )}
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-white">
        <h2 className="text-3xl font-semibold text-center mb-8 transition-transform duration-300 hover:text-blue-800 hover:scale-105">
          Customer Reviews
        </h2>
        <div className="flex flex-wrap justify-center gap-12">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="w-80 p-8 rounded-lg shadow-lg bg-gray-50 border border-blue-300 hover:border-blue-800 transform transition-all hover:shadow-2xl hover:scale-105"
            >
              <p className="italic text-gray-700">"{review.text}"</p>
              <p className="mt-4 text-right text-gray-900 font-medium">- {review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20 bg-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-8 transition-transform duration-300 hover:text-blue-800 hover:scale-105">
          Our Trusted Partners
        </h2>
        <div className="flex justify-center flex-wrap gap-8">
          {brands.map((brand, index) => (
            <img
              key={index}
              src={brand}
              alt={`Brand ${index + 1}`}
              className="w-28 h-auto transform transition-transform hover:scale-110"
            />
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  );
};

export default HomePage;
