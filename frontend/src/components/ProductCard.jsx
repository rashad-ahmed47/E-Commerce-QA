import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();     // prevent Link navigation
    e.stopPropagation();
    if (product.stockQuantity === 0) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isOnSale  = product.salePrice && product.salePrice < product.price;
  const display   = isOnSale ? product.salePrice : product.price;
  const fallback  = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  const imgSrc    = product.images?.length > 0 ? product.images[0] : fallback;

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
      {/* Image */}
      <Link to={`/product/${product._id}`} className="block relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOnSale && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              SALE
            </span>
          )}
        </div>
        {product.stockQuantity < 5 && product.stockQuantity > 0 && (
          <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            Only {product.stockQuantity} left
          </span>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1 rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">{product.category}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors text-sm leading-snug mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Ratings row */}
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          </div>
        )}

        {/* Price + cart */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-gray-900">${display.toFixed(2)}</span>
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0}
            title={product.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
            className={`p-2.5 rounded-xl transition-all shadow-sm text-sm font-medium flex items-center gap-1.5 ${
              added
                ? 'bg-green-500 text-white scale-95'
                : product.stockQuantity === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            {added
              ? <Check className="w-4 h-4" />
              : <ShoppingCart className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
