import React from 'react';

const FilterSidebar = ({ onFilterChange }) => {
  const categories = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'];

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Filters</h3>
        
        <div className="mb-6">
          <h4 className="font-medium text-sm text-gray-700 mb-3 uppercase tracking-wider">Category</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center group cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer"
                  onChange={(e) => onFilterChange('category', cat, e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-sm text-gray-700 mb-3 uppercase tracking-wider">Price Range</h4>
          <div className="flex items-center space-x-2">
            <input 
              type="number" 
              placeholder="Min" 
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
            />
            <span className="text-gray-500">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
        
        <button 
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
          onClick={() => onFilterChange('reset')}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
