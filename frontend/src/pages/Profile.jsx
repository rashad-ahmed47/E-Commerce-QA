import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, History, Trash2, Loader2, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, token, login } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch profile to get recently viewed
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.recentlyViewed) {
          setRecentlyViewed(data.recentlyViewed);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password: password || undefined })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      
      // Update local auth context
      login({ ...user, name: data.name, email: data.email });
      setSuccess('Profile updated successfully');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch('/api/auth/recently-viewed', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRecentlyViewed([]);
        setSuccess('Browsing history cleared');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Account Details
            </h2>
            
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 border border-red-100">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-2 bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 border border-green-100">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {success}
              </div>
            )}

            <form onSubmit={submitHandler} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password (optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Recently Viewed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Browsing History
              </h2>
              {recentlyViewed.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : recentlyViewed.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">You haven't viewed any products recently.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recentlyViewed.map(item => (
                  <Link key={item._id} to={`/product/${item._id}`} className="group block bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-indigo-200 transition-colors">
                    <div className="aspect-square bg-white rounded-lg overflow-hidden mb-3">
                      <img 
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">{item.category}</p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600">{item.name}</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">${item.price.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Profile;
