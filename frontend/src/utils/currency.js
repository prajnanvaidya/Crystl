// Currency conversion rates (you may want to fetch this from an API in production)
const USD_TO_INR = 88; // As of September 2023 (you should update this or use an API)

export const formatCurrency = (amount, fromCurrency = 'USD', toCurrency = 'INR') => {
  const formatOptions = {
    USD: { style: 'currency', currency: 'USD' },
    INR: { style: 'currency', currency: 'INR' }
  };

  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    const inrAmount = amount * USD_TO_INR;
    return {
      original: new Intl.NumberFormat('en-US', formatOptions.USD).format(amount),
      converted: new Intl.NumberFormat('en-IN', formatOptions.INR).format(inrAmount),
      numericOriginal: amount,
      numericConverted: inrAmount
    };
  }

  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    const usdAmount = amount / USD_TO_INR;
    return {
      original: new Intl.NumberFormat('en-IN', formatOptions.INR).format(amount),
      converted: new Intl.NumberFormat('en-US', formatOptions.USD).format(usdAmount),
      numericOriginal: amount,
      numericConverted: usdAmount
    };
  }

  // If same currency or unsupported conversion
  return {
    original: new Intl.NumberFormat('en-US', formatOptions[fromCurrency]).format(amount),
    converted: null,
    numericOriginal: amount,
    numericConverted: null
  };
};

// Helper function to format currency with both USD and INR
export const formatCurrencyWithBoth = (amount, fromCurrency = 'USD') => {
  const result = formatCurrency(amount, fromCurrency);
  return `${result.original} (${result.converted})`;
};
