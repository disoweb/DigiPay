import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useWalletRefresh() {
  const queryClient = useQueryClient();

  const refreshWalletData = useCallback(async () => {
    // Invalidate and refetch all wallet-related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
      queryClient.refetchQueries({ queryKey: ["/api/user"] }),
    ]);
    
    // Small delay to ensure data is fresh
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  const forceRefresh = useCallback(async () => {
    // Use query invalidation instead of page reload
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
      queryClient.refetchQueries({ queryKey: ["/api/user"] }),
      queryClient.refetchQueries({ queryKey: ["/api/transactions"] })
    ]);
  }, [queryClient]);

  return {
    refreshWalletData,
    forceRefresh
  };
}