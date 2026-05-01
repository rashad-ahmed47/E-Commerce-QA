import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChevronDown, Package, PlusCircle, List, ArrowLeftRight, Settings } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-1.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">
              E<span className="text-indigo-600">-SHOP</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 flex justify-center max-w-xl">
            <SearchDropdown />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Sell Button */}
            {isAuthenticated && (
              <Link
                to="/seller/add"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Sell
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              id="navbar-cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              /* User dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  id="navbar-user-menu"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/seller"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5"><Package className="w-4 h-4" /> My Listings</div>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <List className="w-4 h-4" /> My Orders
                    </Link>

                    <Link
                      to="/returns"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <ArrowLeftRight className="w-4 h-4" /> My Returns
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>

                    {isAdmin && (
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        id="navbar-logout"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                id="navbar-signin"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-500/20 transition-all"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
