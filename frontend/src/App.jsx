import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

import Home from './pages/Home';
import PDP from './pages/PDP';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<PDP />} />
            <Route path="/login" element={<div className="flex w-full items-center justify-center"><Login /></div>} />
            <Route path="/register" element={<div className="flex w-full items-center justify-center"><Register /></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
