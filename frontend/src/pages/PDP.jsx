import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck } from 'lucide-react';

const PDP = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-20 animate-pulse text-xl font-bold text-gray-400">Loading Product...</div>;
  if (!product) return <div className="text-center py-20 text-xl font-bold text-gray-900">Product not found</div>;

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Product Images */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          <div className="flex lg:flex-col gap-4 overflow-auto lg:w-24 flex-shrink-0">
            {images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setMainImage(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${mainImage === idx ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
              </button>
            ))}
          </div>
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm relative group cursor-zoom-in">
            <img src={images[mainImage]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125" alt={product.name} />
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="text-base text-gray-700 space-y-6">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <ShieldCheck className="w-5 h-5" /> In Stock and ready to ship ({product.stockQuantity} available)
            </div>
            
            <button className="w-full bg-indigo-600 border border-transparent rounded-xl py-4 px-8 flex items-center justify-center text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30">
              <ShoppingCart className="w-6 h-6 mr-2" /> Add to bag
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-8 grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <Truck className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="font-semibold text-gray-900 text-sm">Free Shipping</span>
                <span className="text-xs text-gray-500">On orders over $50</span>
             </div>
             <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <Star className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="font-semibold text-gray-900 text-sm">Premium Quality</span>
                <span className="text-xs text-gray-500">100% Guaranteed</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDP;
