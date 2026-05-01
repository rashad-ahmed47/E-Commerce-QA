import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Tag, DollarSign, RotateCcw, Loader2 } from 'lucide-react';

const FilterSidebar = ({ onFilterChange, activeFilters = {} }) => {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [minPrice, setMinPrice]     = useState(activeFilters.minPrice || '');
  const [maxPrice, setMaxPrice]     = useState(activeFilters.maxPrice || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res  = await fetch('/api/products/categories');
        const data = await res.json();
        setCategories(data); // [{ _id: 'Electronics', count: 12 }, ...]
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    onFilterChange('reset');
  };

  const handlePriceApply = () => {
    onFilterChange('minPrice', minPrice);
    onFilterChange('maxPrice', maxPrice);
  };

  const hasActiveFilters = activeFilters.category || activeFilters.minPrice || activeFilters.maxPrice;

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* Categories */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</h4>
            </div>

            {catLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : (
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label
                    key={cat._id}
                    className="flex items-center justify-between group cursor-pointer py-1.5 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={activeFilters.category === cat._id}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer w-4 h-4"
                        onChange={(e) => onFilterChange('category', cat._id, e.target.checked)}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-indigo-700 font-medium transition-colors">
                        {cat._id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                      {cat.count}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Price Range</h4>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <span className="text-gray-400 font-bold text-sm">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handlePriceApply}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>

          {/* Sort */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Sort By</h4>
            <select
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white transition-all"
              onChange={(e) => onFilterChange('sort', e.target.value)}
              defaultValue="-createdAt"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="price">Price: Low → High</option>
              <option value="-price">Price: High → Low</option>
              <option value="-rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
