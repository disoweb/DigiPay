import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TradeTimerProps {
  paymentDeadline: string | null;
  tradeStatus: string;
}

export function TradeTimer({ paymentDeadline, tradeStatus }: TradeTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!paymentDeadline || tradeStatus !== "payment_pending") {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(paymentDeadline).getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Mark as urgent if less than 5 minutes remaining
      setIsUrgent(minutes < 5);
      
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentDeadline, tradeStatus]);

  if (tradeStatus !== "payment_pending" || !paymentDeadline) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      isExpired 
        ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
        : isUrgent 
        ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300"
        : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
    }`}>
      {isExpired ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      
      <span className="text-sm font-medium">
        {isExpired ? "Payment Expired" : "Payment Time Left"}
      </span>
      
      <Badge 
        variant={isExpired ? "destructive" : isUrgent ? "secondary" : "default"}
        className={
          isExpired 
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
            : isUrgent 
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        }
      >
        {timeLeft}
      </Badge>
    </div>
  );
}