import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col bg-white rounded-xl h-[380px] p-4 shadow-sm">
            <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 w-1/2 rounded mb-4"></div>
            <div className="mt-auto bg-gray-200 h-8 w-1/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
