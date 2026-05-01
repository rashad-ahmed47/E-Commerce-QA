import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Truck, CheckCircle, AlertCircle, Calendar, ArrowLeftRight, Loader2 } from 'lucide-react';

const Orders = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/myorders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'text-green-600 bg-green-50 border-green-200';
      case 'Processing': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>

      {error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-6">You haven't placed any orders yet.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Order Placed</p>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-sm font-bold text-gray-900">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Order #</p>
                    <p className="text-sm font-mono text-gray-900">{order._id.substring(order._id.length - 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                  {order.status === 'Delivered' ? <CheckCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                  {order.status}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <Link to={`/product/${item.product}`}>
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'} 
                          alt={item.name} 
                          className="w-20 h-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link to={`/product/${item.product}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-sm">
                          {item.name}
                        </Link>
                        <p className="text-gray-500 text-sm mt-1">Qty: {item.qty}</p>
                        <p className="font-bold text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                  {order.status === 'Delivered' && (
                    <button
                      onClick={() => navigate('/returns', { state: { orderId: order._id } })}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg transition-colors border border-gray-200"
                    >
                      <ArrowLeftRight className="w-4 h-4" /> Request Return
                    </button>
                  )}
                  {/* Simulate Pay button if not paid */}
                  {!order.isPaid && (
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/orders/${order._id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
                          window.location.reload();
                        } catch (e) { alert('Payment failed'); }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
