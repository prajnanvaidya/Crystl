// src/components/Navbar.jsx - UPDATED AND FIXED

import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- Import our auth hook

const Navbar = () => {
  const { user, logout } = useAuth(); // <-- Get user and logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Redirect to homepage after logout
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <RouterLink to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-[#0B95D6]">Crystl</h1>
          </RouterLink>

          {/* Navigation Links (You can keep or remove these as you wish) */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <RouterLink to="/" className="text-gray-700 hover:text-[#0B95D6] px-3 py-2 text-sm font-medium transition-colors duration-300">
                Home
              </RouterLink>
              {/* Add other links like #features if you build those sections */}
            </div>
          </div>

          {/* Action Buttons - DYNAMICALLY RENDERED */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              {user ? (
                // --- If user is logged in ---
                <>
                  <RouterLink to="/dashboard" className="bg-[#0B95D6] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0A7BB8] transition-colors duration-300">
                    Dashboard ({user.name})
                  </RouterLink>
                  <button onClick={handleLogout} className="text-gray-700 hover:text-[#0B95D6] px-4 py-2 text-sm font-medium transition-colors duration-300">
                    Logout
                  </button>
                </>
              ) : (
                // --- If user is logged out ---
                <>
                  <RouterLink to="/login" className="text-gray-700 hover:text-[#0B95D6] px-4 py-2 text-sm font-medium transition-colors duration-300">
                    Log In
                  </RouterLink>
                  <RouterLink to="/register" className="bg-[#0B95D6] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0A7BB8] transition-colors duration-300">
                    Sign Up
                  </RouterLink>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button (Functionality can be added later) */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-[#0B95D6] focus:outline-none focus:text-[#0B95D6]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;