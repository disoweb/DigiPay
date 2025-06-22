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
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

interface TradeTimerProps {
  paymentDeadline?: string;
  status: string;
}

export function TradeTimer({ paymentDeadline, status }: TradeTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!paymentDeadline || status !== "payment_pending") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deadline = new Date(paymentDeadline).getTime();
      const remaining = Math.max(0, deadline - now);

      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentDeadline, status]);

  if (!paymentDeadline || status !== "payment_pending") return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const totalMinutes = 15; // 15 minute deadline
  const progressPercentage = Math.max(0, (minutes / totalMinutes) * 100);

  return (
    <Card className={`${isExpired ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-orange-600'}`} />
          <span className={`font-medium ${isExpired ? 'text-red-900' : 'text-orange-900'}`}>
            Payment Timer
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Time Remaining:</span>
            <span className={`font-bold ${isExpired ? 'text-red-700' : 'text-orange-700'}`}>
              {isExpired ? "EXPIRED" : `${minutes}:${seconds.toString().padStart(2, '0')}`}
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isExpired ? 'bg-red-200' : 'bg-orange-200'}`}
          />
          
          {isExpired ? (
            <p className="text-xs text-red-700 mt-2">
              ⚠️ Payment deadline has expired. Trade may be cancelled.
            </p>
          ) : (
            <p className="text-xs text-orange-700 mt-2">
              Complete payment before timer expires to avoid cancellation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
