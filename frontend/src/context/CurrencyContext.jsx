// src/context/CurrencyContext.jsx
import React, { createContext, useState, useContext } from 'react';

const CurrencyContext = createContext();

// Fixed rate for the hackathon
const USD_TO_INR_RATE = 88;

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD'); // Default currency

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'USD' ? 'INR' : 'USD'));
  };

  // Helper function to format amounts based on selected currency
  const formatAmount = (usdAmount) => {
    if (currency === 'INR') {
      const inrAmount = usdAmount * USD_TO_INR_RATE;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(inrAmount);
    }
    // Default to USD
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdAmount);
  };

  const value = { currency, toggleCurrency, formatAmount };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook for easy context usage
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
