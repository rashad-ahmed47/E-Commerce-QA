import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const Checkout = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    address: '', city: '', postalCode: '', country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const shippingPrice = totalPrice >= 50 ? 0 : 5.99;
  const taxPrice = Number((0.15 * totalPrice).toFixed(2));
  const orderTotal = totalPrice + shippingPrice + taxPrice;

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return setError('Your cart is empty');
    
    setError('');
    setLoading(true);

    const orderItems = cartItems.map(item => ({
      product: item._id,
      name: item.name,
      qty: item.qty,
      image: item.images?.[0] || '',
      price: item.salePrice || item.price
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice: totalPrice,
          taxPrice,
          shippingPrice,
          totalPrice: orderTotal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Order Placed!</h1>
        <p className="text-gray-500 text-lg">Thank you for your purchase. We are redirecting you to your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
      
      {error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={placeOrder} className="flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" /> Shipping Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
                <input required name="address" value={shippingAddress.address} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <input required name="city" value={shippingAddress.city} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="New York" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Postal Code</label>
                  <input required name="postalCode" value={shippingAddress.postalCode} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="10001" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                <input required name="country" value={shippingAddress.country} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="USA" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Method
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="paymentMethod" value="Credit Card" checked={paymentMethod === 'Credit Card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                <span className="font-semibold text-sm">Credit Card (Simulated)</span>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="paymentMethod" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                <span className="font-semibold text-sm">Cash on Delivery</span>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              {cartItems.map(item => (
                <div key={item._id} className="flex gap-3 text-sm">
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'} className="w-12 h-12 rounded object-cover border" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.qty} × ${(item.salePrice || item.price).toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-gray-900">${((item.salePrice || item.price) * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Items Total</span>
                <span className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-semibold text-gray-900">{shippingPrice === 0 ? 'FREE' : `$${shippingPrice.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (15%)</span>
                <span className="font-semibold text-gray-900">${taxPrice.toFixed(2)}</span>
              </div>
              <div className="pt-3 flex justify-between border-t border-gray-100 mt-3">
                <span className="font-bold text-gray-900 text-base">Total</span>
                <span className="font-black text-xl text-indigo-600">${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || cartItems.length === 0}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
