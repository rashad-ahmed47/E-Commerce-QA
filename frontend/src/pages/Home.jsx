import React, { useState, useEffect } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type, value, isChecked) => {
    if (type === 'reset') {
      setFilters({});
      return;
    }
    
    setFilters(prev => {
      const newFilters = { ...prev };
      if (type === 'category') {
        if (isChecked) {
          newFilters.category = value; // Simplistic: single category select for now
        } else {
          delete newFilters.category;
        }
      } else {
        if (value === '') delete newFilters[type];
        else newFilters[type] = value;
      }
      return newFilters;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar onFilterChange={handleFilterChange} />
        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Discover Products</h2>
            <p className="text-gray-500 mt-1">Explore our premium collection</p>
          </div>
          <ProductGrid products={products} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Home;
