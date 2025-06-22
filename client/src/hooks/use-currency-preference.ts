
import { useState, useEffect } from 'react';

export type CurrencyPreference = 'NGN' | 'USD';

export function useCurrencyPreference() {
  const [currency, setCurrency] = useState<CurrencyPreference>(() => {
    // Get saved preference from localStorage
    const saved = localStorage.getItem('portfolio-currency-preference');
    return (saved as CurrencyPreference) || 'NGN';
  });

  // Save preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio-currency-preference', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'NGN' ? 'USD' : 'NGN');
  };

  return {
    currency,
    setCurrency,
    toggleCurrency
  };
}
