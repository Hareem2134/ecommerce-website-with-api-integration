"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProductBySlug } from "@/app/api/productAPI"; // CRITICAL: Implement this function
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  Star,
  Share2,
  ShieldCheck,
  Truck,
  Undo2,
  Tag,
  MessageSquare,
  Heart,
  Info, // Added Info for Toast
} from "lucide-react";
import { useWishlist, WishlistItem } from "@/context/WishlistContext";

// Imports for React Slick Slider
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import Sanity client
import { client } from "@/sanity/lib/client"; // Adjust path if necessary

// --- INTERFACES ---
interface ProductSpecification {
  name: string;
  value: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string; // Ensure slug is part of the Product interface
  price: number;
  originalPrice?: number;
  imageUrl: string;
  galleryImages?: string[];
  category: string;
  description: string;
  inStock: boolean;
  sku?: string;
  brand?: string;
  averageRating?: number;
  reviewCount?: number;
  specifications?: ProductSpecification[];
}

interface Review {
  _id: string;
  author: string;
  rating: number;
  comment: string;
  date: string; // ISO date string
}

interface SanityFeaturedProduct {
  _id: string;
  name: string;
  slug: { current: string };
  description: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  category?: {
    title: string;
  };
}
// --- END INTERFACES ---

const ProductDetailsPage = () => {
  // --- STATE VARIABLES ---
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // Wishlist and Toast State
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist(); 
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  // --- END STATE VARIABLES ---

  const params = useParams();
  const router = useRouter();

  const slugParam = params?.slug;
  const currentProductSlug = Array.isArray(slugParam) ? slugParam[0] : typeof slugParam === 'string' ? slugParam : undefined;

  const { addToCart, cart } = useCart();

  // --- EFFECTS ---
  // Fetch main product details
  useEffect(() => {
    if (!currentProductSlug) {
      setError("Product slug is missing. Cannot fetch product.");
      setIsLoading(false);
      return;
    }

    const fetchProductData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let fetchedProduct = await fetchProductBySlug(currentProductSlug); 
        if (fetchedProduct) {
          if (!fetchedProduct.specifications) {
            fetchedProduct.specifications = [
              { name: "Dimensions", value: "10cm x 5cm x 2cm" },
              { name: "Weight", value: "200g" },
              { name: "Material", value: "Premium Alloy" },
            ];
          }
          setProduct(fetchedProduct);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductData();
  }, [currentProductSlug]);

  // Set selected image for gallery
  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrl);
    }
  }, [product]);

  // Fetch featured products from Sanity
  useEffect(() => {
    const fetchFeaturedSanityProducts = async () => {
      setIsLoadingFeatured(true);
      try {
        const sanityData: SanityFeaturedProduct[] = await client.fetch(
          `*[_type == "product" && slug.current != $currentProductSlug][0...6] {
            _id,
            name,
            slug,
            description,
            price,
            "imageUrl": image.asset->url,
            inStock,
            category->{
              title
            }
          }`, { currentProductSlug: product?.slug || currentProductSlug || "" }
        );
        const normalizedFeatured = sanityData.map((sp) => ({
          _id: sp._id,
          name: sp.name,
          slug: sp.slug.current,
          price: sp.price,
          imageUrl: sp.imageUrl,
          description: sp.description,
          inStock: sp.inStock,
          category: sp.category?.title || "Uncategorized",
        }));
        setFeaturedProducts(normalizedFeatured);
      } catch (error) {
        console.error("Failed to fetch featured products from Sanity:", error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };
    if (product || currentProductSlug) {
        fetchFeaturedSanityProducts();
    } else if (!isLoading && !product) {
        fetchFeaturedSanityProducts();
    }
  }, [product, currentProductSlug, isLoading]);

  // Fetch product reviews from Sanity
  useEffect(() => {
    if (product && product._id) {
      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        try {
          const reviewsData: Review[] = await client.fetch(
            `*[_type == "review" && product._ref == $productId] | order(date desc) {
              _id,
              author,
              rating,
              comment,
              date
            }`, { productId: product._id }
          );
          setProductReviews(reviewsData || []);
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
          setProductReviews([]);
        } finally {
          setIsLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [product]);
  // --- END EFFECTS ---

  // --- HELPER FUNCTIONS & CONSTANTS ---
  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const isProductInCart = (productId: string) => cart.some((item) => item.id === productId);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product._id,
      title: product.name,
      price: product.price,
      image: product.imageUrl,
      quantity: quantity,
      slug: ""
    });
    // Optionally: display toast for cart addition
    // displayToast(`${product.name} added to cart!`, "success");
  };

  const displayToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Hide toast after 3 seconds
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    const wishlistItem: WishlistItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      slug: product.slug,
    };

    if (isWishlisted(product._id)) {
      removeFromWishlist(product._id);
      displayToast(`${product.name} removed from wishlist.`, "success"); 
    } else {
      addToWishlist(wishlistItem);
      displayToast(`${product.name} added to wishlist!`, "success");
    }
  };


  const pageBackgroundColor = "#cacbce";
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const StarRatingDisplay = ({ rating = 0, reviewCount, showReviewCount = false }: { rating?: number; reviewCount?: number, showReviewCount?: boolean }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0; 
    const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);
    const halfGradientId = `halfGradient-${React.useId()}`;

    return (
      <div className="flex items-center space-x-1">
         <svg width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }}>
            <defs>
            <linearGradient id={halfGradientId}>
                <stop offset="50%" stopColor="rgb(250 204 21)" />
                <stop offset="50%" stopColor="rgb(209 213 219)" stopOpacity="1" />
            </linearGradient>
            </defs>
        </svg>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={20} className="text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && <Star key="half" size={20} className="text-yellow-400" fill={`url(#${halfGradientId})`} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={20} className="text-gray-300 fill-gray-300" />
        ))}
        {showReviewCount && reviewCount !== undefined && reviewCount > 0 && (
          <a href="#reviews" className="ml-2 text-sm text-blue-600 hover:underline flex items-center">
            <MessageSquare size={16} className="mr-1"/> ({reviewCount} reviews)
          </a>
        )}
      </div>
    );
  };
  // --- END HELPER FUNCTIONS & CONSTANTS ---


  // --- RENDER LOGIC: LOADING, ERROR, NO PRODUCT ---
  if (isLoading) {
    return (
      <div style={{ backgroundColor: pageBackgroundColor }} className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-xl">Loading Product Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: pageBackgroundColor }} className="flex flex-col items-center justify-center min-h-screen text-red-700 p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-semibold mb-3">Oops! Something went wrong.</h2>
        <p className="text-lg mb-8">{error}</p>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg">Go Back</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: pageBackgroundColor }} className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <AlertTriangle className="w-16 h-16 text-yellow-600 mb-4" />
        <p className="text-2xl font-semibold">Product not found.</p>
        <button onClick={() => router.back()} className="mt-6 bg-gray-700 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors text-lg">Go Back</button>
      </div>
    );
  }
  // --- END RENDER LOGIC: LOADING, ERROR, NO PRODUCT ---

  const categoryName = product.category;
  const sliderSettings = {
    dots: true,
    infinite: featuredProducts.length > 2,
    speed: 500,
    slidesToShow: Math.min(3, featuredProducts.length || 1),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: Math.min(2, featuredProducts.length || 1), slidesToScroll: 1, infinite: featuredProducts.length > 1 } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1, infinite: featuredProducts.length > 0 } }
    ]
  };

  return (
    <div style={{ backgroundColor: pageBackgroundColor }} className="min-h-screen py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[100] p-4 rounded-md shadow-lg text-white flex items-center
                      ${toastType === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {toastType === "success" ? <CheckCircle size={20} className="mr-2" /> : <XCircle size={20} className="mr-2" />}
          <span>{toastMessage}</span>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-gray-700 flex items-center space-x-1.5 flex-wrap">
          <Link href="/" className="hover:text-blue-600 hover:underline">Home</Link>
          <ChevronRight size={14} className="text-gray-500" />
          <Link href="/Shop" className="hover:text-blue-600 hover:underline">Shop</Link>
          {categoryName && (
            <>
              <ChevronRight size={14} className="text-gray-500" />
              <Link href={`/Shop?category=${encodeURIComponent(categoryName)}`} className="hover:text-blue-600 hover:underline capitalize">
                {categoryName}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="text-gray-500" />
          <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Product Image Section */}
            <div className="lg:w-1/2 p-6 md:p-8 bg-gray-50 flex flex-col items-center justify-center">
              <div className="relative mb-4 w-full aspect-square max-w-lg">
                <img src={selectedImage || product.imageUrl} alt={product.name} className="w-full h-full object-contain rounded-lg shadow-lg"/>
                {/* Updated Wishlist Button on Image */}
                <button
                  onClick={handleToggleWishlist}
                  className={`absolute top-4 right-4 p-2 bg-white/70 backdrop-blur-sm rounded-full transition-colors ${
                    isWishlisted(product._id) ? "text-red-500" : "text-gray-600 hover:text-red-500"
                  }`}
                  aria-label={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart
                    size={24}
                    fill={isWishlisted(product._id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
              {product.galleryImages && product.galleryImages.length > 0 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto pb-2 justify-center">
                  {[product.imageUrl, ...product.galleryImages].filter((v, i, a) => a.indexOf(v) === i)
                  .map((img, idx) => (
                    <img key={idx} src={img} alt={`${product.name} thumbnail ${idx + 1}`}
                      className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage === img ? 'border-blue-500 shadow-md' : 'border-transparent'} hover:border-blue-400 transition-all`}
                      onClick={() => setSelectedImage(img)} />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="lg:w-1/2 p-6 md:p-10 flex flex-col">
              {product.brand && <p className="text-sm text-gray-500 mb-1 font-medium">{product.brand}</p>}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-800 mb-2 leading-tight">{product.name}</h1>
              <div className="mb-3">
                <StarRatingDisplay rating={product.averageRating} reviewCount={product.reviewCount} showReviewCount={true} />
              </div>
              {product.sku && <p className="text-xs text-gray-500 mb-3 flex items-center"><Tag size={14} className="mr-1.5 text-gray-400"/>SKU: {product.sku}</p>}
              <div className="mb-5">
                {product.originalPrice && product.originalPrice > product.price && <span className="text-xl text-gray-500 line-through mr-2">${product.originalPrice.toFixed(2)}</span>}
                <span className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                {product.originalPrice && product.originalPrice > product.price && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">SAVE ${ (product.originalPrice - product.price).toFixed(2) } ({ Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) }%)</span>}
              </div>
              <div className={`flex items-center text-md font-semibold mb-6 py-2 px-3 rounded-md inline-flex shadow-sm ${product.inStock ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {product.inStock ? <CheckCircle size={20} className="mr-2"/> : <XCircle size={20} className="mr-2"/>}
                {product.inStock ? "In Stock" : "Out of Stock"}
              </div>
              <div className="prose prose-sm sm:prose text-gray-700 mb-6 max-w-none"><p>{product.description?.substring(0,150)}{product.description && product.description.length > 150 ? "..." : ""}</p></div>

              {/* Actions Area */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                {product.inStock && !isProductInCart(product._id) && (
                  <div className="flex items-center mb-6">
                    <label htmlFor="quantity" className="mr-4 font-semibold text-gray-700">Quantity:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                      <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="p-3 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg" aria-label="Decrease quantity"><Minus size={18}/></button>
                      <input type="number" id="quantity" name="quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center text-lg font-medium border-y-0 border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-full py-2.5" min="1"/>
                      <button onClick={() => handleQuantityChange(1)} className="p-3 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg" aria-label="Increase quantity"><Plus size={18}/></button>
                    </div>
                  </div>
                )}
                {isProductInCart(product._id) ? (
                  <Link href="/Cart" className="w-full flex items-center justify-center bg-green-600 text-white px-6 py-3.5 rounded-lg font-semibold text-lg hover:bg-green-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"><CheckCircle size={22} className="mr-2.5"/>View in Cart</Link>
                ) : product.inStock ? (
                  <button onClick={handleAddToCart} className="w-full flex items-center justify-center bg-blue-600 text-white py-3.5 px-6 rounded-lg font-semibold text-lg transform transition-all duration-300 ease-in-out hover:bg-blue-700 hover:scale-105 hover:shadow-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!product.inStock}><ShoppingCart size={22} className="mr-2.5"/>Add to Cart</button>
                ) : (
                  <p className="text-center text-gray-600 font-semibold text-lg py-3">This product is currently unavailable.</p>
                )}
                <div className="mt-6 flex items-center justify-between text-sm">
                    <div className="flex space-x-3 items-center">
                        <span className="font-medium text-gray-700">Share:</span>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700" title="Share on Facebook"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500" title="Tweet this product"><svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-.422.724-.665 1.56-.665 2.452 0 1.735.884 3.269 2.228 4.165-.82-.026-1.594-.252-2.27-.625v.054c0 2.424 1.722 4.44 3.996 4.903-.418.113-.859.172-1.314.172-.321 0-.633-.031-.937-.091.635 1.982 2.476 3.429 4.658 3.471-1.709 1.341-3.858 2.141-6.192 2.141-.403 0-.8-.024-1.19-.069 2.205 1.412 4.821 2.236 7.668 2.236 9.207 0 14.241-7.632 13.995-14.246.979-.702 1.825-1.576 2.499-2.589z"/></svg></a>
                    </div>
                    {/* Updated Wishlist Text Button */}
                    <button
                      onClick={handleToggleWishlist}
                      className={`flex items-center text-sm font-medium transition-colors duration-150 ${
                        isWishlisted(product._id)
                          ? "text-red-500 hover:text-red-700"
                          : "text-gray-600 hover:text-red-500"
                      }`}
                      aria-label={isWishlisted(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <Heart
                        size={18}
                        className="mr-1.5"
                        fill={isWishlisted(product._id) ? "currentColor" : "none"}
                      />
                      {isWishlisted(product._id) ? "In Wishlist" : "Add to Wishlist"}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Sections */}
        <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg"><div className="flex items-center text-blue-600 mb-3"><Truck size={28} className="mr-3"/><h3 className="text-xl font-semibold text-gray-800">Shipping Information</h3></div><ul className="space-y-1 text-sm text-gray-600 list-disc list-inside"><li>Estimated delivery: 3-5 business days.</li><li>Free shipping on orders over $50.</li><li>International shipping available.</li></ul></div>
            <div className="bg-white p-6 rounded-lg shadow-lg"><div className="flex items-center text-blue-600 mb-3"><Undo2 size={28} className="mr-3"/><h3 className="text-xl font-semibold text-gray-800">Return Policy</h3></div><ul className="space-y-1 text-sm text-gray-600 list-disc list-inside"><li>30-day easy returns.</li><li>Full refund or exchange.</li><li><Link href="/returns-policy" className="text-blue-600 hover:underline">Read full policy</Link></li></ul></div>
            <div className="bg-white p-6 rounded-lg shadow-lg"><div className="flex items-center text-blue-600 mb-3"><ShieldCheck size={28} className="mr-3"/><h3 className="text-xl font-semibold text-gray-800">Shop With Confidence</h3></div><ul className="space-y-1 text-sm text-gray-600 list-disc list-inside"><li>Secure SSL Encrypted Checkout.</li><li>100% Genuine Products.</li><li>Excellent Customer Support.</li></ul></div>
        </div>

        {/* Product Details & Reviews Tabs */}
        <div id="product-details-tabs" className="mt-10 md:mt-12 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex border-b mb-6 space-x-1 sm:space-x-4">
                {["description", "specifications", "reviews"].map((tabName) => (
                    <button key={tabName} onClick={() => setActiveTab(tabName as any)}
                        className={`py-2 px-3 sm:px-4 font-medium text-sm sm:text-base focus:outline-none capitalize ${ activeTab === tabName ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"}`}>
                        {tabName === 'reviews' ? `Reviews (${productReviews.length})` : tabName}
                    </button>
                ))}
            </div>
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
                {activeTab === "description" && (
                    <>
                        <h3 className="text-xl font-semibold mb-3 text-gray-800">Description</h3>
                        <p>{product.description || "No detailed description available."}</p>
                    </>
                )}
                {activeTab === "specifications" && (
                    <>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Product Specifications</h3>
                        {product.specifications && product.specifications.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {product.specifications.map((spec, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-4 py-3 font-medium text-gray-800 w-1/3 whitespace-nowrap">{spec.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{spec.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (<p className="text-gray-500 italic">No specifications available for this product.</p>)}
                    </>
                )}
                {activeTab === "reviews" && (
                    <>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Customer Reviews</h3>
                        {isLoadingReviews ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3"/><span>Loading reviews...</span></div>
                        ) : productReviews.length > 0 ? (
                            <div className="space-y-6">
                                {productReviews.map((review) => (
                                    <div key={review._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm not-prose">
                                        <div className="flex items-center mb-2">
                                            <StarRatingDisplay rating={review.rating} />
                                            <span className="ml-auto text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-800 text-base">{review.author}</h4>
                                        <p className="mt-1 text-gray-700 text-sm">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (<p className="text-gray-500 italic">No reviews yet for this product. Be the first to write one!</p>)}
                    </>
                )}
            </div>
        </div>

        {/* Featured Products Section */}
        <section className="mt-10 md:mt-12 py-8 bg-gradient-to-b from-blue-50 to-gray-50 px-4 sm:px-6 md:px-8 rounded-lg">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">You Might Also Like</h2>
          {isLoadingFeatured ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/><p className="ml-3 text-gray-600">Loading recommendations...</p></div>
          ) : featuredProducts.length > 0 ? (
            <Slider {...sliderSettings}>
              {featuredProducts.map((fp) => (
                <div key={fp._id} className="p-2 sm:p-4">
                  <div className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-200 hover:border-blue-500">
                    <Link href={`/products/${fp.slug}`} className="block group">
                      <div className="relative"><img src={fp.imageUrl} alt={fp.name} className="w-full h-48 sm:h-56 object-cover group-hover:opacity-90 transition-opacity"/></div>
                    </Link>
                    <div className="p-4 sm:p-6">
                      <p className="text-xs text-gray-500 mb-1 capitalize">{fp.category}</p>
                      <h3 className="text-md sm:text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-blue-600"><Link href={`/products/${fp.slug}`} className="hover:underline">{fp.name}</Link></h3>
                      <div className="flex flex-col sm:flex-row justify-between items-center mt-3">
                        <span className="text-lg sm:text-xl font-bold text-blue-700 mb-2 sm:mb-0">${fp.price.toFixed(2)}</span>
                        {isProductInCart(fp._id) ? (
                          <Link href="/Cart" className="w-full sm:w-auto text-center px-3 py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105">In Cart</Link>
                        ) : fp.inStock ? (
                          <button onClick={() => addToCart({
                            id: fp._id, title: fp.name, price: fp.price, image: fp.imageUrl, quantity: 1,
                            slug: ""
                          })} className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105">Add to Cart</button>
                        ) : (<span className="px-3 py-2 text-xs sm:text-sm bg-gray-200 text-gray-500 font-semibold rounded-lg">Out of Stock</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (<p className="text-center text-gray-500 text-lg">No other recommendations at this time.</p>)}
        </section>
      </div>
    </div>
  );
};

export default ProductDetailsPage;