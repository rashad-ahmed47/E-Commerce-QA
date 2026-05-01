import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Package, Eye, EyeOff, Upload,
  BarChart2, DollarSign, AlertTriangle, CheckCircle,
  Loader2, AlertCircle, X, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const statusBadge = (qty, threshold) => {
  if (qty === 0) return <span className="badge red">Out of Stock</span>;
  if (qty <= threshold) return <span className="badge amber">Low Stock</span>;
  return <span className="badge green">In Stock</span>;
};

const SellerDashboard = () => {
  const { token } = useAuth();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');
  const [deleting, setDeleting]   = useState(null); // productId being deleted
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult]   = useState(null);
  const bulkRef = useRef();

  const authHeader = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/products/myproducts', { headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyProducts(); }, []);

  // ── Toggle visibility (isHidden) ──
  const toggleHidden = async (product) => {
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method:  'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isHidden: !product.isHidden }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
      setProducts(p => p.map(x => x._id === product._id ? { ...x, isHidden: !x.isHidden } : x));
      showToast(product.isHidden ? 'Product is now visible' : 'Product hidden from store');
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Delete ──
  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method:  'DELETE',
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(p => p.filter(x => x._id !== productId));
      showToast('Product deleted');
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  // ── Bulk upload ──
  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkLoading(true);
    setBulkResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res  = await fetch('/api/products/bulk', {
        method: 'POST', headers: authHeader, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBulkResult({ success: data.message, errors: data.errors });
      fetchMyProducts();
    } catch (e) {
      setBulkResult({ error: e.message });
    } finally {
      setBulkLoading(false);
      e.target.value = '';
    }
  };

  // ── Stats ──
  const totalRevenue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
  const outOfStock   = products.filter(p => p.stockQuantity === 0).length;
  const active       = products.filter(p => !p.isHidden).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Listings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage all your products for sale</p>
        </div>
        <Link
          to="/seller/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> List New Product
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Package,      label: 'Total Listings',  value: products.length,       color: 'indigo' },
          { icon: Eye,          label: 'Active',           value: active,                color: 'green'  },
          { icon: AlertTriangle,label: 'Out of Stock',     value: outOfStock,            color: 'red'    },
          { icon: DollarSign,   label: 'Inventory Value',  value: `$${totalRevenue.toFixed(0)}`, color: 'amber' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-${color}-50`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Bulk upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Bulk Upload
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Upload multiple products at once via CSV or Excel file</p>
          </div>
          <div className="flex items-center gap-3">
            {bulkLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
            <button
              onClick={() => bulkRef.current.click()}
              disabled={bulkLoading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Upload CSV / Excel
            </button>
            <input ref={bulkRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} />
          </div>
        </div>
        {bulkResult && (
          <div className={`mt-3 text-xs rounded-lg px-3 py-2 ${bulkResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {bulkResult.error || bulkResult.success}
            {bulkResult.errors?.length > 0 && (
              <ul className="mt-1 list-disc list-inside">
                {bulkResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-500 text-sm mb-6">Start selling by listing your first product.</p>
          <Link to="/seller/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> List Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Visible', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p._id} className={`hover:bg-gray-50/50 transition-colors ${p.isHidden ? 'opacity-60' : ''}`}>
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            : <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.category}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      ${p.price.toFixed(2)}
                      {p.salePrice && <span className="block text-xs text-red-500 line-through">${p.salePrice.toFixed(2)}</span>}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">{p.stockQuantity}</td>
                    <td className="px-5 py-4">{statusBadge(p.stockQuantity, p.safetyThreshold || 5)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleHidden(p)}
                        title={p.isHidden ? 'Show in store' : 'Hide from store'}
                        className={`p-1.5 rounded-lg transition-colors ${p.isHidden ? 'bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600' : 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500'}`}
                      >
                        {p.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/seller/edit/${p._id}`}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          disabled={deleting === p._id}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === p._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .badge { padding: 2px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
        .badge.red    { background: #FEE2E2; color: #DC2626; }
        .badge.amber  { background: #FEF3C7; color: #D97706; }
        .badge.green  { background: #D1FAE5; color: #059669; }
      `}</style>
    </div>
  );
};

export default SellerDashboard;
