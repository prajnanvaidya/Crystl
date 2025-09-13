// src/pages/RegisterPage.jsx - REWRITTEN AND IMPROVED

import React, {useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

// It's better to import icons from a dedicated library like heroicons
// To install: npm install @heroicons/react
import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid';

const RegisterPage = () => {
  // --- STATE MANAGEMENT ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [formError, setFormError] = useState(''); // For errors from the backend
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- DERIVED STATE & VALIDATION (This is a much cleaner pattern) ---
  const isNameValid = name.trim().length > 0;
  
  // Email validation: check only when the user has typed something
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = email.length > 0 && !isEmailValid ? 'Please enter a valid email address.' : '';
  
  // Password validation: check only when the user has typed something
  const isPasswordValid = password.length >= 6;
  const passwordError = password.length > 0 && !isPasswordValid ? 'Password must be at least 6 characters.' : '';

  // The entire form is valid only if all individual fields are valid
  const isFormValid = isNameValid && isEmailValid && isPasswordValid && !isLoading;

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // This check is now much simpler
    if (!isFormValid) {
      setFormError('Please ensure all fields are filled out correctly.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await register(role, { name, email, password });
      // The navigation logic after registration is correct
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
          navigate('/');
          break;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Registration failed. This email may already be in use.';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleButtonStyle = (buttonRole) =>
    role === buttonRole ? 'bg-[#0B95D6] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0B95D6]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F4B400]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Create an Account</h1>
        <p className="text-center text-gray-600 mb-6">Join Crystl and start tracking funds today.</p>

        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setRole('user')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('user')}`}>User</button>
          <button onClick={() => setRole('department')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('department')}`}>Department</button>
          <button onClick={() => setRole('institution')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${getRoleButtonStyle('institution')}`}>Institution</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* --- Name Input --- */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name / Organization Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border text-gray-900 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0B95D6] focus:border-[#0B95D6]"
            />
          </div>

          {/* --- Email Input with Validation --- */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Dynamically apply red border on error
              className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md text-gray-900 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#0B95D6] focus:border-[#0B95D6]'
              }`}
            />
            {emailError && <p className="mt-1 text-red-600 text-sm">{emailError}</p>}
          </div>

          {/* --- Password Input with Validation and Show/Hide Button --- */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 block w-full pr-10 px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm text-gray-900 ${
                    passwordError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#0B95D6] focus:border-[#0B95D6]'
                  }`}
                />
                {/* The show/hide button is now placed correctly inside the relative container */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-1 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none outline-none focus:ring-0"
                >
                  {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
            </div>
            {passwordError && <p className="mt-1 text-red-600 text-sm">{passwordError}</p>}
          </div>

          {/* --- Global Form Error Display (for backend errors) --- */}
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Registration Error</p>
              <p>{formError}</p>
            </div>
          )}

          {/* --- Submit Button --- */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid} // The `disabled` logic is now much simpler
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#0B95D6] hover:bg-[#0A7BB8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B95D6] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <RouterLink to="/login" className="font-medium text-[#0B95D6] hover:text-[#0A7BB8]">
            Sign In
          </RouterLink>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;