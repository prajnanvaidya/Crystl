import React, { useState } from 'react';

const Roles = () => {
  const [activeRole, setActiveRole] = useState('institution');

  const roles = {
    institution: {
      title: 'Institution Admin',
      description: 'Manage your institution\'s financial data with powerful admin tools. Upload documents, set permissions, and oversee department activities with comprehensive analytics and reporting capabilities.',
      features: ['Upload financial documents', 'Manage departments', 'Set user permissions', 'Generate reports', 'Monitor compliance']
    },
    department: {
      title: 'Department Employee',
      description: 'Access department-specific financial data and contribute to transparency. View budgets, submit expenses, and collaborate with your team while maintaining data accuracy.',
      features: ['View department budgets', 'Submit expense reports', 'Track spending', 'Collaborate with team', 'Access analytics']
    },
    public: {
      title: 'Public Viewer',
      description: 'Explore public financial data with intuitive visualizations. Search institutions, analyze spending patterns, and understand how public funds are being utilized across different sectors.',
      features: ['Browse public data', 'Visualize spending', 'Search institutions', 'Download reports', 'Track trends']
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Access tailored for every user
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're managing finances, working in a department, or exploring public data, 
            we have the right tools for your needs.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-2 rounded-2xl inline-flex">
            {Object.keys(roles).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setActiveRole(roleKey)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeRole === roleKey
                    ? 'bg-[#0B95D6] text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-[#0B95D6] hover:bg-gray-200'
                }`}
              >
                {roles[roleKey].title}
              </button>
            ))}
          </div>
        </div>

        {/* Role Description Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {roles[activeRole].title}
            </h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {roles[activeRole].description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles[activeRole].features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#0B95D6] rounded-full"></div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roles;
