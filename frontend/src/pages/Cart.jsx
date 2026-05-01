import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center w-full">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-sm">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <ShoppingCart className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear all
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items list */}
        <div className="flex-1 space-y-4">
          {cartItems.map((item) => {
            const isOnSale = item.salePrice && item.salePrice < item.price;
            const price    = isOnSale ? item.salePrice : item.price;
            const imgSrc   = item.images?.length > 0
              ? item.images[0]
              : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start transition-all hover:shadow-md"
              >
                {/* Image */}
                <Link to={`/product/${item._id}`} className="flex-shrink-0">
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item._id}`}>
                    <h3 className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-indigo-500 font-medium mt-0.5">{item.category}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base font-extrabold text-gray-900">${price.toFixed(2)}</span>
                    {isOnSale && (
                      <span className="text-xs text-gray-400 line-through">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Qty + Remove */}
                <div className="flex flex-col items-end gap-3">
                  {/* Qty controls */}
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        if (item.qty <= 1) removeFromCart(item._id);
                        else updateQty(item._id, item.qty - 1);
                      }}
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[2rem] text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item._id, Math.min(item.stockQuantity, item.qty + 1))}
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <p className="text-sm font-bold text-indigo-600">${(price * item.qty).toFixed(2)}</p>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={`font-semibold ${totalPrice >= 50 ? 'text-green-600' : 'text-gray-900'}`}>
                  {totalPrice >= 50 ? 'FREE' : '$5.99'}
                </span>
              </div>
              {totalPrice < 50 && (
                <p className="text-xs text-indigo-500 bg-indigo-50 px-3 py-2 rounded-lg">
                  Add ${(50 - totalPrice).toFixed(2)} more for free shipping!
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-black text-xl text-gray-900">
                  ${(totalPrice + (totalPrice >= 50 ? 0 : 5.99)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              id="checkout-btn"
              onClick={handleCheckout}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className="mt-3 flex items-center justify-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
