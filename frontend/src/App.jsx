import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home    from './pages/Home';
import PDP     from './pages/PDP';
import Login   from './pages/Login';
import Register from './pages/Register';
import Cart    from './pages/Cart';
import ProtectedRoute from './components/ProtectedRoute';

// New Pages
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Returns from './pages/Returns';
import SellerDashboard from './pages/seller/SellerDashboard';
import AddEditProduct from './pages/seller/AddEditProduct';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            <main className="flex-grow flex w-full">
              <Routes>
                {/* Public Routes */}
                <Route path="/"          element={<Home />} />
                <Route path="/product/:id" element={<PDP />} />
                <Route path="/cart"      element={<Cart />} />
                <Route
                  path="/login"
                  element={
                    <div className="flex w-full items-center justify-center py-12 px-4">
                      <Login />
                    </div>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <div className="flex w-full items-center justify-center py-12 px-4">
                      <Register />
                    </div>
                  }
                />

                {/* Protected Buyer Routes */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />

                {/* Protected Seller Routes */}
                <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                <Route path="/seller/add" element={<ProtectedRoute><AddEditProduct /></ProtectedRoute>} />
                <Route path="/seller/edit/:id" element={<ProtectedRoute><AddEditProduct /></ProtectedRoute>} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 mt-auto py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} E-SHOP. All rights reserved.
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
