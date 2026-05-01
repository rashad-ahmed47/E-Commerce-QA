import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Package, DollarSign, Tag, Hash, AlignLeft, BarChart2,
  Plus, Trash2, Upload, X, Loader2, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home', 'Beauty', 'Sports',
  'Books', 'Toys', 'Automotive', 'Food', 'Other'
];

const AddEditProduct = () => {
  const { id }       = useParams();          // present → edit mode
  const isEdit       = Boolean(id);
  const { token }    = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name: '', sku: '', price: '', description: '',
    category: '', stockQuantity: '', attributes: [],
  });
  const [existingImages, setExistingImages] = useState([]); // URLs already on server
  const [newFiles, setNewFiles]   = useState([]);            // File objects to upload
  const [previews, setPreviews]   = useState([]);            // base64 previews for new files
  const [loading, setLoading]     = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const fileInputRef              = useRef();

  // ------- Load product if editing -------
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res  = await fetch(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setForm({
          name:          data.name        || '',
          sku:           data.sku         || '',
          price:         data.price       ?? '',
          description:   data.description || '',
          category:      data.category    || '',
          stockQuantity: data.stockQuantity ?? '',
          attributes:    data.attributes
            ? Object.entries(data.attributes).map(([k, v]) => ({ key: k, value: v }))
            : [],
        });
        setExistingImages(data.images || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [id, isEdit, token]);

  // ------- Field helpers -------
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addAttr   = () => setForm(f => ({ ...f, attributes: [...f.attributes, { key: '', value: '' }] }));
  const removeAttr = (i) => setForm(f => ({ ...f, attributes: f.attributes.filter((_, idx) => idx !== i) }));
  const setAttr   = (i, part, val) => setForm(f => ({
    ...f,
    attributes: f.attributes.map((a, idx) => idx === i ? { ...a, [part]: val } : a)
  }));

  // ------- Image handling -------
  const handleFileChange = (e) => {
    const files = [...e.target.files];
    const allowed = 5 - existingImages.length - newFiles.length;
    const toAdd   = files.slice(0, allowed);
    setNewFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(p => [...p, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeNewFile = (i) => {
    setNewFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const removeExisting = (url) => setExistingImages(imgs => imgs.filter(u => u !== url));

  // ------- Submit -------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Validation
    if (!form.name.trim())        return setError('Product name is required');
    if (!form.sku.trim())         return setError('SKU is required');
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
                                   return setError('Valid price is required');
    if (!form.category)           return setError('Category is required');
    if (!form.description.trim()) return setError('Description is required');

    // Build attributes map JSON
    const attrsMap = {};
    for (const a of form.attributes) {
      if (a.key.trim()) attrsMap[a.key.trim()] = a.value.trim();
    }

    const fd = new FormData();
    fd.append('name',          form.name);
    fd.append('sku',           form.sku);
    fd.append('price',         form.price);
    fd.append('description',   form.description);
    fd.append('category',      form.category);
    fd.append('stockQuantity', form.stockQuantity || 0);
    fd.append('attributes',    JSON.stringify(attrsMap));
    newFiles.forEach(file => fd.append('images', file));

    setLoading(true);
    try {
      const url    = isEdit ? `/api/products/${id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product');
      setSuccess(isEdit ? 'Product updated successfully!' : 'Product listed successfully!');
      setTimeout(() => navigate('/seller'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalImages = existingImages.length + newFiles.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Back */}
      <button
        onClick={() => navigate('/seller')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Listings
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {isEdit ? 'Edit Product' : 'List a Product for Sale'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isEdit ? 'Update your listing details below.' : 'Fill in the details and your product will appear in the store.'}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Basic Info ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" /> Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input
                className="input"
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>
            {/* SKU */}
            <div>
              <label className="label">SKU *</label>
              <div className="relative">
                <Hash className="abs-icon" />
                <input
                  className="input pl-9"
                  placeholder="e.g. WNC-2024-BLK"
                  value={form.sku}
                  onChange={e => set('sku', e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Category */}
            <div>
              <label className="label">Category *</label>
              <div className="relative">
                <Tag className="abs-icon" />
                <select
                  className="input pl-9 bg-white"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Price */}
            <div>
              <label className="label">Price *</label>
              <div className="relative">
                <DollarSign className="abs-icon" />
                <input
                  type="number" min="0" step="0.01"
                  className="input pl-9"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Stock */}
            <div>
              <label className="label">Stock Quantity</label>
              <div className="relative">
                <BarChart2 className="abs-icon" />
                <input
                  type="number" min="0"
                  className="input pl-9"
                  placeholder="0"
                  value={form.stockQuantity}
                  onChange={e => set('stockQuantity', e.target.value)}
                />
              </div>
            </div>
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="label">Description *</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  className="input pl-9 resize-none"
                  rows={4}
                  placeholder="Describe your product in detail..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Images ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" /> Product Images
            <span className="ml-auto text-xs text-gray-400 font-normal">{totalImages}/5 uploaded</span>
          </h2>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={url} alt="existing" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(url)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New file previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-300 group">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {totalImages < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Click to upload images</span>
              <span className="text-xs">JPG, PNG, WebP — up to {5 - totalImages} more</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        {/* ── Attributes ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" /> Attributes
              <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </h2>
            <button
              type="button"
              onClick={addAttr}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {form.attributes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No attributes yet. Add size, color, material, etc.
            </p>
          ) : (
            <div className="space-y-3">
              {form.attributes.map((attr, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    placeholder="Key (e.g. Color)"
                    value={attr.key}
                    onChange={e => setAttr(i, 'key', e.target.value)}
                  />
                  <span className="text-gray-400 font-bold text-sm">:</span>
                  <input
                    className="input flex-1"
                    placeholder="Value (e.g. Red)"
                    value={attr.value}
                    onChange={e => setAttr(i, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttr(i)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/seller')}
            className="flex-1 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
            ) : isEdit ? (
              <><CheckCircle className="w-5 h-5" /> Save Changes</>
            ) : (
              <><Package className="w-5 h-5" /> List Product</>
            )}
          </button>
        </div>
      </form>

      {/* Shared utility styles via Tailwind's @apply can't be used in JSX,
          so we inject a tiny style tag with the reusable classes */}
      <style>{`
        .label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
        .input { display: block; width: 100%; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.15s; }
        .input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .input::placeholder { color: #9CA3AF; }
        .abs-icon { position: absolute; left: 0.75rem; top: 0.875rem; width: 1rem; height: 1rem; color: #9CA3AF; }
      `}</style>
    </div>
  );
};

export default AddEditProduct;
