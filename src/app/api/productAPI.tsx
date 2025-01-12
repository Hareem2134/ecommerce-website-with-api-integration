import { client } from "@/sanity/lib/client"; // Sanity client configuration

// Fetch all products from the Sanity dataset
export const fetchProducts = async () => {
  try {
    const query = `*[_type == "product"] {
      _id,
      name,
      price,
      "imageUrl": image.asset->url,
      slug,
      category->title,
      description,
      inStock
    }`;

    const products = await client.fetch(query);

    if (!products || products.length === 0) {
      throw new Error("No products found");
    }

    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error; // Propagate the error for the caller to handle
  }
};

// Fetch a single product by its slug
export const fetchProductBySlug = async (slug: string) => {
  try {
    const query = `*[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      "imageUrl": image.asset->url,
      "category": category->title,
      price,
      description,
      inStock
    }`;

    const product = await client.fetch(query, { slug });

    if (!product) {
      throw new Error(`Product with slug "${slug}" not found`);
    }

    return product;
  } catch (error) {
    console.error(`Failed to fetch product with slug "${slug}":`, error);
    throw error;
  }
};

