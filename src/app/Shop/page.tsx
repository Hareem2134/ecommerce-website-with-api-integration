import React from "react";
import { client } from "@/sanity/lib/client";
import ShopPageClient from "../../../components/ShopPageClient";

export const metadata = {
  title: "Shop",
};

async function fetchProducts() {
  try {
    const products = await client.fetch(`*[_type == "product"] {
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
    return products;
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default async function ShopPage() {
  const products = await fetchProducts();

  return (
    <div>
      <ShopPageClient initialProducts={products} />
    </div>
  );
}
