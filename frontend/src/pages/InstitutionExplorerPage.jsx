import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaSearch, FaBuilding, FaSpinner } from 'react-icons/fa';

const InstitutionExplorerPage = () => {
  const [institutions, setInstitutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/public/institutions?search=${searchTerm}`);
        setInstitutions(data.institutions);
      } catch (err) {
        setError('Could not fetch institutions.');
      } finally {
        setIsLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchInstitutions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Institutions</h1>
            <p className="text-lg text-gray-600">
              Select an institution to view its public financial data and spending analysis.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-4 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                {error}
              </div>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                &times;
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading institutions...</p>
              </div>
            </div>
          )}

          {/* Institutions List */}
          {!isLoading && (
            <div className="space-y-4">
              {institutions.length > 0 ? (
                institutions.map((inst) => (
                  <Link
                    key={inst._id}
                    to={`/institution/${inst._id}`}
                    className="block no-underline hover:no-underline"
                  >
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 group">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FaBuilding className="text-blue-600 text-xl" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {inst.name}
                          </h3>
                          <p className="text-gray-600 mt-1">View financial data and analytics</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <FaBuilding className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No institutions found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No institutions available at the moment'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionExplorerPage;