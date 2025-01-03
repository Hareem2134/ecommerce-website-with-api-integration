import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion } from "framer-motion"; // Optional for advanced animations
import Link from "next/link";

const HeroSection = () => {
  const banners = ["/banner1.png", "/banner2.png", "/banner3.png", "/banner4.png"];

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2200,
    fade: true,
  };

  return (
    <div className="relative">
      <Slider {...settings}>
        {banners.map((banner, index) => (
          <div key={index} className="relative h-110">
            <motion.img
              src={banner}
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <motion.div
                className="text-center text-white"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <h1 className="text-4xl font-bold mb-4">
                  Welcome to Our Shop
                </h1>
                <p className="mb-6">
                  Find everything you need in one place.
                </p>
                <motion.button
                  className="bg-blue-500 px-6 py-2 rounded hover:bg-blue-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/Shop">Shop Now</Link>
                </motion.button>
              </motion.div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HeroSection;
