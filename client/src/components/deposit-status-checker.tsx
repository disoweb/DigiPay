import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DepositStatusCheckerProps {
  onRetry: () => void;
}

export function DepositStatusChecker({ onRetry }: DepositStatusCheckerProps) {
  const { data: pendingData, refetch } = useQuery({
    queryKey: ["deposit-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments/pending");
      if (!res.ok) throw new Error('Failed to check deposit status');
      return res.json();
    },
    refetchInterval: 3000,
  });

  if (!pendingData?.pendingDeposit) {
    return null;
  }

  const deposit = pendingData.pendingDeposit;
  const createdAt = new Date(deposit.createdAt);
  const minutesAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-800 font-medium">
              Previous deposit attempt detected (₦{parseFloat(deposit.amount).toLocaleString()})
            </p>
            <p className="text-orange-700 text-sm">
              Started {minutesAgo} minutes ago. If payment wasn't completed, you can try again.
            </p>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-orange-700 border-orange-300"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Check
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}