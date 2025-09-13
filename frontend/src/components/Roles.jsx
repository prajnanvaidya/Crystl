import React, { useState, useRef, useEffect } from 'react';

const Roles = () => {
  const [activeRole, setActiveRole] = useState('institution');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const rolesContainerRef = useRef(null);

  // Minimum swipe distance required
  const minSwipeDistance = 50;

  const roles = {
    institution: {
      title: 'Institution Admin',
      icon: '🏛️',
      description: 'Manage your institution\'s financial data with powerful admin tools. Upload documents, set permissions, and oversee department activities.',
      features: ['Upload financial documents', 'Manage departments', 'Set user permissions', 'Generate reports', 'Monitor compliance'],
      color: 'from-blue-400 to-blue-500'
    },
    department: {
      title: 'Department Employee',
      icon: '👨‍💼',
      description: 'Access department-specific financial data and contribute to transparency. View budgets, submit expenses, and collaborate with your team.',
      features: ['View department budgets', 'Submit expense reports', 'Track spending', 'Collaborate with team', 'Access analytics'],
      color: 'from-green-400 to-green-500'
    },
    public: {
      title: 'Public Viewer',
      icon: '👁️',
      description: 'Explore public financial data with intuitive visualizations. Search institutions, analyze spending patterns, and understand public fund utilization.',
      features: ['Browse public data', 'Visualize spending', 'Search institutions', 'Download reports', 'Track trends'],
      color: 'from-purple-400 to-purple-500'
    }
  };

  const roleKeys = Object.keys(roles);

  // Handle touch events for swiping
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      const currentIndex = roleKeys.indexOf(activeRole);
      const nextIndex = (currentIndex + 1) % roleKeys.length;
      setActiveRole(roleKeys[nextIndex]);
    } else if (isRightSwipe) {
      const currentIndex = roleKeys.indexOf(activeRole);
      const prevIndex = (currentIndex - 1 + roleKeys.length) % roleKeys.length;
      setActiveRole(roleKeys[prevIndex]);
    }
  };

  // Auto-rotate roles
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = roleKeys.indexOf(activeRole);
      const nextIndex = (currentIndex + 1) % roleKeys.length;
      setActiveRole(roleKeys[nextIndex]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeRole]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-[#0B95D6] uppercase tracking-wider mb-2">User Roles</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Access tailored for <span className="text-[#0B95D6]">every user</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're managing finances, working in a department, or exploring public data, 
            we have the right tools for your needs.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl inline-flex shadow-md border border-gray-200">
            {Object.keys(roles).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setActiveRole(roleKey)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 mx-1 ${
                  activeRole === roleKey
                    ? `bg-gradient-to-r ${roles[roleKey].color} text-white shadow-md`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{roles[roleKey].icon}</span>
                <span className="hidden sm:inline">{roles[roleKey].title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Role Cards with Swipe Feature */}
        <div 
          ref={rolesContainerRef}
          className="relative max-w-3xl mx-auto overflow-hidden rounded-2xl shadow-md bg-white"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
            <div 
              className={`h-full bg-gradient-to-r ${roles[activeRole].color} transition-all duration-500`}
              style={{ 
                width: `${((roleKeys.indexOf(activeRole) + 1) / roleKeys.length) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Role Description Card */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{roles[activeRole].icon}</span>
              <h3 className="text-xl font-bold text-gray-900">
                {roles[activeRole].title}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {roles[activeRole].description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles[activeRole].features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 rounded-md bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-r ${roles[activeRole].color}`}></div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Dots for Mobile */}
        <div className="flex justify-center mt-6 space-x-2 md:hidden">
          {roleKeys.map((roleKey, index) => (
            <button
              key={roleKey}
              onClick={() => setActiveRole(roleKey)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeRole === roleKey 
                  ? `bg-gradient-to-r ${roles[roleKey].color} scale-125` 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            ></button>
          ))}
        </div>

        {/* Swipe Hint for Mobile */}
        <div className="text-center mt-4 text-gray-400 text-xs md:hidden flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
          </svg>
          Swipe to explore
        </div>
      </div>
    </section>
  );
};

export default Roles;