import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import UploadPage from './pages/UploadPage';
import CollectionsPage from './pages/CollectionsPage';
import InventoryPage from './pages/InventoryPage';

function App() {
  const location = useLocation();

  const navLinks = [
    { icon: '📦', label: 'Products', path: '/' },
    { icon: '📤', label: 'Upload', path: '/upload' },
    { icon: '🗂️', label: 'Collections', path: '/collections' },
    { icon: '📊', label: 'Inventory', path: '/inventory' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Modern Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
                <span className="text-xl">🛍️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Shopify Manager</h1>
                <p className="text-xs text-slate-500">Product Suite</p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    location.pathname === link.path
                      ? 'bg-blue-100 text-blue-700 shadow-md'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center text-sm text-slate-600">
            <p>© 2026 Shopify Manager. All rights reserved.</p>
            <p className="text-slate-500">API v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
