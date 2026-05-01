import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, DollarSign, Package, AlertTriangle, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!statsRes.ok || !usersRes.ok) throw new Error('Failed to fetch admin data');
      
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const updateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      setSuccess('User role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" /> Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Overview of platform metrics and user management</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-2 bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 border border-green-100">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-green-50 text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Total Revenue</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalOrders}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Total Orders</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.pendingReturns}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Pending Returns</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1 font-medium">Registered Users</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock Alerts
            </h2>
            {stats?.lowStockProducts?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">All products are well stocked.</p>
            ) : (
              <div className="space-y-4">
                {stats?.lowStockProducts?.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <span className="flex-shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {p.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Management */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> User Management
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Email</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Current Role</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 
                          u.role === 'Support' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u._id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                        >
                          <option value="Customer">Make Customer</option>
                          <option value="Support">Make Support</option>
                          <option value="Admin">Make Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
