import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PendingDepositAlertProps {
  pendingDeposit: any;
  onCancelled: () => void;
}

export function PendingDepositAlert({ pendingDeposit, onCancelled }: PendingDepositAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/cancel-pending");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to cancel pending deposit');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pending Deposit Cancelled",
        description: "You can now start a new deposit",
      });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsVisible(false);
      onCancelled();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Cancel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isVisible || !pendingDeposit) return null;

  const createdAt = new Date(pendingDeposit.createdAt);
  const timeAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60));

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-amber-800 font-medium">
            You have a pending deposit of ₦{parseFloat(pendingDeposit.amount).toLocaleString()}
          </p>
          <p className="text-amber-700 text-sm">
            <Clock className="h-3 w-3 inline mr-1" />
            Started {timeAgo} minutes ago
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-amber-600 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}