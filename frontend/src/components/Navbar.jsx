import React from 'react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-[#0B95D6]">Crystl</h1>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#home" className="text-gray-700 hover:text-[#0B95D6] px-3 py-2 text-sm font-medium transition-colors duration-300">
                Home
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#0B95D6] px-3 py-2 text-sm font-medium transition-colors duration-300">
                Contact
              </a>
              <a href="#features" className="text-gray-700 hover:text-[#0B95D6] px-3 py-2 text-sm font-medium transition-colors duration-300">
                Features
              </a>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <button className="text-gray-700 hover:text-[#0B95D6] px-4 py-2 text-sm font-medium transition-colors duration-300">
                Sign in
              </button>
              <button className="bg-[#0B95D6] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0A7BB8] transition-colors duration-300">
                Log in
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
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
