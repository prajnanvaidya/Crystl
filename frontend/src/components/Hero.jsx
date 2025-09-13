import React from 'react';

const Hero = () => {
  return (
    <section id="home" className="relative bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0B95D6] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F4B400] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-60 h-60 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            See where public funds go with{' '}
            <span className="text-[#0B95D6]">complete transparency</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Track, analyze, and understand how public institutions manage their finances. 
            Get real-time insights into budget allocations and spending patterns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-[#0B95D6] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#0A7BB8] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Explore Institutions
            </button>
            <button className="bg-white text-[#0B95D6] px-8 py-4 rounded-xl text-lg font-semibold border-2 border-[#0B95D6] hover:bg-[#0B95D6] hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
