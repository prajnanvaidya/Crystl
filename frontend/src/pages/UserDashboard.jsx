// src/pages/UserDashboard.jsx - RE-STYLED AND IMPROVED

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import {
  BookmarkIcon as BookmarkSolidIcon,
  SearchIcon,
  ExclamationIcon,
  CheckCircleIcon
} from '@heroicons/react/solid';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/outline';

// --- Re-styled Institution Card Component ---
const InstitutionCard = ({ institution, isFollowed, onFollow, onUnfollow }) => {
  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    // The entire card is a link, handled by the parent Grid item
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col justify-between">
      {/* Top section with name */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 truncate">{institution.name}</h3>
        {/* Placeholder for future details */}
        <p className="text-sm text-gray-500 mt-1">Public Financial Data</p>
      </div>
      
      {/* Bottom section with action buttons */}
      <div className="mt-4">
        {isFollowed ? (
          <button
            onClick={(e) => handleButtonClick(e, () => onUnfollow(institution._id))}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
          >
            <BookmarkSolidIcon className="h-5 w-5 mr-2 text-red-500" />
            Unfollow
          </button>
        ) : (
          <button
            onClick={(e) => handleButtonClick(e, () => onFollow(institution._id))}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <BookmarkOutlineIcon className="h-5 w-5 mr-2" />
            Follow
          </button>
        )}
      </div>
    </div>
  );
};


// --- Main User Dashboard Component ---
const UserDashboard = () => {
  // --- (All your state and logic remains the same - it's perfect) ---
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [followedInstitutions, setFollowedInstitutions] = useState([]);
  const [displayedInstitutions, setDisplayedInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added for success feedback
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const fetchFollowed = useCallback(async () => {
    try {
      const { data } = await api.get('/user/dashboard');
      setFollowedInstitutions(data.followedInstitutions);
    } catch (err) {
      setError('Could not fetch your followed institutions.');
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const allInstPromise = api.get('/public/institutions');
        // fetchFollowed is now called inside the Promise.all
        const [allInstResponse] = await Promise.all([allInstPromise, fetchFollowed()]);
        setAllInstitutions(allInstResponse.data.institutions);
      } catch (err) {
        setError('Failed to load institution data from the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [fetchFollowed]);

  useEffect(() => {
    let listToDisplay = activeTab === 0 ? allInstitutions : followedInstitutions;
    if (searchTerm) {
      listToDisplay = listToDisplay.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setDisplayedInstitutions(listToDisplay);
  }, [activeTab, allInstitutions, followedInstitutions, searchTerm]);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handleFollow = async (institutionId) => {
    try {
      await api.post(`/user/follow/${institutionId}`);
      setSuccess('Successfully followed institution!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchFollowed();
    } catch (err) {
      setError('Failed to follow institution.');
    }
  };

  const handleUnfollow = async (institutionId) => {
    try {
      await api.post(`/user/unfollow/${institutionId}`);
      setSuccess('Successfully unfollowed institution.');
      setTimeout(() => setSuccess(''), 3000);
      await fetchFollowed();
    } catch (err) {
      setError('Failed to unfollow institution.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="mt-4 text-gray-600 font-medium">Loading Institutions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Header --- */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Institution Explorer</h1>
          <p className="mt-1 text-md text-gray-500">Discover and follow institutions to track their financial transparency.</p>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Feedback Banners --- */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-6 shadow-sm flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div><p className="font-bold">Success</p><p>{success}</p></div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-6 shadow-sm flex items-center gap-3">
            <ExclamationIcon className="h-6 w-6 text-red-600" />
            <div><p className="font-bold">Error</p><p>{error}</p></div>
          </div>
        )}

        {/* --- Search and Filter Controls --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-8 sticky top-20 z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by institution name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            <div className="md:col-span-4 bg-gray-100 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => handleTabChange(0)}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 0 ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                All Institutions
              </button>
              <button
                onClick={() => handleTabChange(1)}
                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 1 ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Followed
              </button>
            </div>
          </div>
        </div>

        {/* --- Institutions Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedInstitutions.length > 0 ? (
            displayedInstitutions.map((inst) => {
              const isFollowed = followedInstitutions.some(followedInst => followedInst._id === inst._id);
              return (
                <RouterLink key={inst._id} to={`/institution/${inst._id}`} className="block">
                  <InstitutionCard
                    institution={inst}
                    isFollowed={isFollowed}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                  />
                </RouterLink>
              );
            })
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 text-gray-500">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Institutions Found</h3>
              <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;