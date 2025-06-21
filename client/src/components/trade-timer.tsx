import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";

interface TradeTimerProps {
  paymentDeadline: string | null;
  status: string;
}

export function TradeTimer({ paymentDeadline, status }: TradeTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!paymentDeadline || !["payment_pending", "pending"].includes(status)) {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(paymentDeadline).getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining("Expired");
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentDeadline, status]);

  if (!paymentDeadline || !["payment_pending", "pending"].includes(status)) {
    return null;
  }

  return (
    <Card className={`${isExpired ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpired ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-orange-600" />
            )}
            <span className={`font-medium ${isExpired ? 'text-red-700' : 'text-orange-700'}`}>
              Payment Window
            </span>
          </div>
          <Badge variant={isExpired ? "destructive" : "secondary"}>
            {timeRemaining}
          </Badge>
        </div>
        <p className={`text-sm mt-2 ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
          {isExpired 
            ? "Payment window has expired. Contact support if payment was made."
            : "Complete payment before timer expires to avoid automatic cancellation."
          }
        </p>
      </CardContent>
    </Card>
  );
}