import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, Check, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const PDP = () => {
  const { id }  = useParams();
  const { addToCart } = useCart();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [mainImage, setMainImage] = useState(0);
  const [qty, setQty]           = useState(1);
  const [added, setAdded]       = useState(false);
  const { isAuthenticated, token } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res  = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    // Track view (fire-and-forget)
    fetch(`/api/products/${id}/track`, { method: 'POST' }).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 animate-pulse">
          <div className="bg-gray-200 aspect-square rounded-2xl" />
          <div className="mt-10 lg:mt-0 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-12 bg-gray-200 rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || product.message) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center w-full">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline text-sm font-medium">← Back to shop</Link>
      </div>
    );
  }

  const isOnSale    = product.salePrice && product.salePrice < product.price;
  const displayPrice = isOnSale ? product.salePrice : product.price;
  const inStock     = product.stockQuantity > 0;
  const images      = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'];

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      
      setReviewSuccess('Review submitted successfully!');
      setComment('');
      // Refetch product to update reviews
      const productRes = await fetch(`/api/products/${id}`);
      setProduct(await productRes.json());
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Shop
        </Link>
        <span>/</span>
        <span className="text-gray-500">{product.category}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* ── Images ── */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex lg:flex-col gap-3 overflow-auto lg:w-20 flex-shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setMainImage(idx)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 w-16 lg:w-full ${
                  mainImage === idx ? 'border-indigo-600 shadow-md' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt={`view ${idx + 1}`} />
              </button>
            ))}
          </div>

          {/* Main image */}
          <div className="flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm relative group cursor-zoom-in">
            <img
              src={images[mainImage]}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt={product.name}
            />
            {isOnSale && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                SALE — {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
              </div>
            )}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="mt-10 lg:mt-0 flex flex-col">
          <p className="text-indigo-500 text-sm font-bold uppercase tracking-widest mb-2">{product.category}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">{product.name}</h1>
          <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.rating.toFixed(1)} ({product.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex items-end gap-3">
            <p className="text-4xl font-black text-gray-900">${displayPrice.toFixed(2)}</p>
            {isOnSale && (
              <p className="text-xl text-gray-400 line-through mb-1">${product.price.toFixed(2)}</p>
            )}
          </div>

          {/* Description */}
          <p className="mt-5 text-gray-600 leading-relaxed text-sm">{product.description}</p>

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(product.attributes).map(([k, v]) => (
                <span key={k} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                  {k}: {v}
                </span>
              ))}
            </div>
          )}

          {/* Stock + Add to cart */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
            {/* Stock status */}
            {inStock ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <ShieldCheck className="w-5 h-5" />
                In Stock — {product.stockQuantity} available
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                <AlertTriangle className="w-5 h-5" />
                Out of Stock
              </div>
            )}

            {/* Qty selector */}
            {inStock && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Qty:</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors"
                  >−</button>
                  <span className="px-4 py-2 text-sm font-bold text-gray-900 min-w-[2.5rem] text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition-colors"
                  >+</button>
                </div>
              </div>
            )}

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-full flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-bold text-base transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !inStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : added
                  ? 'bg-green-500 text-white shadow-green-500/30 focus:ring-green-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 focus:ring-indigo-500'
              }`}
            >
              {added ? (
                <><Check className="w-5 h-5" /> Added to Cart!</>
              ) : (
                <><ShoppingCart className="w-5 h-5" /> {inStock ? 'Add to Cart' : 'Out of Stock'}</>
              )}
            </button>
          </div>

          {/* Perks */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <Truck className="w-7 h-7 text-indigo-500 mb-1" />
              <span className="font-semibold text-gray-900 text-sm">Free Shipping</span>
              <span className="text-xs text-gray-500">On orders over $50</span>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <Star className="w-7 h-7 text-indigo-500 mb-1" />
              <span className="font-semibold text-gray-900 text-sm">Premium Quality</span>
              <span className="text-xs text-gray-500">100% Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Write a review */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
            {isAuthenticated ? (
              <form onSubmit={submitReviewHandler} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                {reviewError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{reviewError}</div>}
                {reviewSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">{reviewSuccess}</div>}
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                  <textarea required rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you think about this product?" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
                </div>
                <button type="submit" disabled={reviewLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg transition-colors">
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-center">
                <p className="text-amber-800 text-sm font-medium mb-4">You need to be logged in to write a review.</p>
                <Link to="/login" className="inline-block px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">Sign In</Link>
              </div>
            )}
          </div>

          {/* List reviews */}
          <div className="lg:col-span-2 space-y-6">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{review.name}</p>
                        <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDP;
