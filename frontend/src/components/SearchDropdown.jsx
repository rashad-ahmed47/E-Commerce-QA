import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchDropdown = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    // Fuzzy search simulation (in a real app, this would be a debounced API call)
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/products?keyword=${query}&limit=5`);
        const data = await response.json();
        setResults(data.products || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    };
    
    const timeoutId = setTimeout(() => fetchResults(), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-lg z-50">
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} // delay to allow clicks
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          <ul>
            {results.map((product) => (
              <li 
                key={product._id} 
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{product.name}</span>
                  <span className="text-xs text-gray-500">{product.category}</span>
                </div>
                <span className="font-semibold text-indigo-600">${product.price}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
