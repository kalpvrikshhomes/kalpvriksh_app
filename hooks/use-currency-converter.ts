import { useState, useEffect, useCallback } from 'react';

const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ExchangeRates {
  [currency: string]: number;
}

interface UseCurrencyConverter {
  convertUSDtoINR: (usdAmount: number) => number | null;
  loading: boolean;
  error: string | null;
}

export function useCurrencyConverter(): UseCurrencyConverter {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.rates && data.rates.INR) {
        setExchangeRate(data.rates.INR);
      } else {
        throw new Error('INR exchange rate not found in API response.');
      }
    } catch (e: any) {
      console.error('Failed to fetch exchange rate:', e);
      setError(e.message || 'Failed to fetch exchange rate.');
      // Fallback to a static rate if API fails, or keep as null
      setExchangeRate(83.0); // Static fallback rate for INR
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExchangeRate();

    const intervalId = setInterval(fetchExchangeRate, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchExchangeRate]);

  const convertUSDtoINR = useCallback((usdAmount: number): number | null => {
    if (exchangeRate === null) {
      return null;
    }
    return usdAmount * exchangeRate;
  }, [exchangeRate]);

  return { convertUSDtoINR, loading, error };
}

// Helper function to format INR currency
export function formatINR(amount: number | null): string {
  if (amount === null) {
    return '₹ --';
  }
  // Using Intl.NumberFormat for robust currency formatting
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
