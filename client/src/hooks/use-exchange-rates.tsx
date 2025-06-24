import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useExchangeRates() {
  const { data: rates = [], isLoading, error } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/exchange-rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Helper function to get a specific rate
  const getRate = (name: string) => {
    const rate = rates.find((r: any) => r.name === name);
    return rate ? parseFloat(rate.rate) : null;
  };

  return {
    rates,
    isLoading,
    error,
    getRate,
    USDT_TO_NGN_RATE: getRate("USDT_TO_NGN") || 1485,
    NGN_TO_USD_RATE: getRate("NGN_TO_USD") || 0.00067,
  };
}