export const fetchProducts = async () => {
  try {
    const response = await fetch("https://fakestoreapi.com/products");
    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error; // Propagate the error for the caller to handle
  }
};

export const fetchProductById = async (id: number) => {
  try {
    const response = await fetch(`https://fakestoreapi.com/products/${id}`);
    if (!response.ok) {
      throw new Error(`Error fetching product with ID ${id}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch product with ID ${id}:`, error);
    throw error; // Propagate the error for the caller to handle
  }
};
