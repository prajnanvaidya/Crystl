// src/pages/LoginPage.jsx (UX Improved)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid'; // <-- UX Improvement: Icons for password toggle

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <-- UX Improvement: State for password visibility

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- UX Improvement: Real-time validation using derived state ---
  // This is a cleaner pattern than using multiple useEffects.
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.trim().length > 0; // For login, we just check if it's not empty.

  // The entire form is valid only if both fields are valid and we are not currently loading.
  const isFormValid = isEmailValid && isPasswordValid && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // A final check before submitting
    if (!isFormValid) {
      setError('Please enter a valid email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(role, { email, password });
      // This navigation logic is already perfect.
      switch (user.role) {
        case 'Institution': navigate('/dashboard/institution'); break;
        case 'Department': navigate('/dashboard/department'); break;
        case 'User': navigate('/dashboard/user'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleButtonStyle = (buttonRole) =>
    role === buttonRole ? 'bg-[#0B95D6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
      {/* ... (background blobs remain the same) ... */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0B95D6]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F4B400]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-6">Select your role and sign in.</p>

        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setRole('user')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('user')}`}>User</button>
          <button onClick={() => setRole('department')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('department')}`}>Department</button>
          <button onClick={() => setRole('institution')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('institution')}`}>Institution</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* --- Email Input with Validation --- */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus // <-- UX Improvement: User can start typing immediately
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // --- UX Improvement: Dynamically change border color on validation error ---
              className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm text-gray-900 ${
                email.length > 0 && !isEmailValid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#0B95D6] focus:border-[#0B95D6]'
              }`}
            />
          </div>

          {/* --- Password Input with Show/Hide Toggle --- */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'} // <-- Toggles input type
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Added pr-10 for padding on the right to make space for the icon
                className="mt-1 block w-full pr-10 px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-[#0B95D6] focus:border-[#0B95D6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-1 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0" // The no-focus-ring fix is here
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {/* --- UX Improvement: Better styled error message --- */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Login Error</p>
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!isFormValid} // <-- UX Improvement: Button is disabled until form is valid
              // --- UX Improvement: Specific styling for the disabled state ---
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#0B95D6] hover:bg-[#0A7BB8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B95D6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                // --- UX Improvement: SVG spinner for loading state ---
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In'}
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