// src/pages/LoginPage.jsx (Restyled with Tailwind CSS)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // The login function in AuthContext will return the user object upon success
      const user = await login(role, { email, password });
      
      // --- NEW REDIRECTION LOGIC ---
      // After a successful login, inspect the user's role to navigate them
      // to the correct dashboard.
      switch (user.role) {
        case 'Institution':
          navigate('/dashboard/institution');
          break;
        case 'Department':
          navigate('/dashboard/department');
          break;
        case 'User':
          navigate('/dashboard/user');
          break;
        default:
          // Fallback to a generic dashboard or homepage if role is unknown
          navigate('/');
          break;
      }
      // --- END OF NEW LOGIC ---

    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for dynamic button styling
  const getRoleButtonStyle = (buttonRole) => {
    return role === buttonRole
      ? 'bg-[#0B95D6] text-white'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0B95D6]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F4B400]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-600 mb-6">Select your role and sign in.</p>

        {/* --- Custom Role Selector --- */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setRole('user')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('user')}`}>
            User
          </button>
          <button onClick={() => setRole('department')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('department')}`}>
            Department
          </button>
          <button onClick={() => setRole('institution')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('institution')}`}>
            Institution
          </button>
        </div>

        {/* --- Login Form --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border text-gray-900 border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0B95D6] focus:border-[#0B95D6] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#0B95D6] focus:border-[#0B95D6] sm:text-sm"
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0B95D6] hover:bg-[#0A7BB8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B95D6] disabled:bg-gray-400 transition-colors duration-300"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <RouterLink to="/register" className="font-medium text-[#0B95D6] hover:text-[#0A7BB8]">
            Sign Up
          </RouterLink>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;