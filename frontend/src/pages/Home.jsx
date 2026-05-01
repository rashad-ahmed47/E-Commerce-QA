import React, { useState, useEffect, useCallback } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ProductGrid from '../components/ProductGrid';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({});
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);

  const fetchProducts = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...currentFilters, page: currentPage, limit: 12 });
      const res    = await fetch(`/api/products?${params.toString()}`);
      const data   = await res.json();
      setProducts(data.products || []);
      setPages(data.pages  || 1);
      setTotal(data.total  || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters, page);
  }, [filters, page, fetchProducts]);

  const handleFilterChange = (type, value, isChecked) => {
    if (type === 'reset') {
      setFilters({});
      setPage(1);
      return;
    }
    setPage(1); // Reset to page 1 on any filter change
    setFilters((prev) => {
      const next = { ...prev };
      if (type === 'category') {
        if (isChecked) next.category = value;
        else delete next.category;
      } else {
        if (value === '' || value === undefined) delete next[type];
        else next[type] = value;
      }
      return next;
    });
  };

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build visible page numbers (max 5 shown)
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <FilterSidebar onFilterChange={handleFilterChange} activeFilters={filters} />

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {filters.category ? filters.category : 'Discover Products'}
              </h2>
              {!loading && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {total > 0 ? `${total} product${total !== 1 ? 's' : ''} found` : 'No products match your filters'}
                </p>
              )}
            </div>
          </div>

          {/* Grid */}
          <ProductGrid products={products} loading={loading} />

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1">
              {/* Prev */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              {/* First page gap */}
              {getPageNumbers()[0] > 1 && (
                <>
                  <button onClick={() => goToPage(1)} className="w-9 h-9 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">1</button>
                  {getPageNumbers()[0] > 2 && <span className="w-9 h-9 flex items-center justify-center text-gray-400">…</span>}
                </>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 text-sm rounded-lg font-medium transition-all ${
                    p === page
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'hover:bg-indigo-50 hover:text-indigo-600 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}

              {/* Last page gap */}
              {getPageNumbers()[getPageNumbers().length - 1] < pages && (
                <>
                  {getPageNumbers()[getPageNumbers().length - 1] < pages - 1 && (
                    <span className="w-9 h-9 flex items-center justify-center text-gray-400">…</span>
                  )}
                  <button onClick={() => goToPage(pages)} className="w-9 h-9 text-sm rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">{pages}</button>
                </>
              )}

              {/* Next */}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === pages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
