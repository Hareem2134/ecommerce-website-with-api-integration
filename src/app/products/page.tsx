"use client"
import React, { useEffect, useState } from 'react';
import ProductCard from '../../../components/ProductCard';
import { fetchProducts } from '../api/productAPI';
import { useCart } from '../../context/CartContext';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts().then((data) => setProducts(data));
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() =>
            addToCart({
              id: product.id.toString(),
              title: product.title,
              price: product.price,
              image: product.image,
              quantity: 1,
            })
          }
        />
      ))}
    </div>
  );
};

export default ProductsPage;
