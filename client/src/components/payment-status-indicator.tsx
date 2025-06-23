import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, CreditCard, Loader2 } from "lucide-react";

interface PaymentStatusIndicatorProps {
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'failed';
  amount?: string;
  reference?: string;
  showAnimation?: boolean;
}

export function PaymentStatusIndicator({ 
  status, 
  amount, 
  reference, 
  showAnimation = true 
}: PaymentStatusIndicatorProps) {
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (showAnimation && status === 'completed') {
      setAnimationClass("animate-bounce");
      const timer = setTimeout(() => setAnimationClass(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, showAnimation]);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          title: 'Payment Pending',
          description: 'Waiting for payment initiation',
          color: 'border-amber-200 bg-amber-50',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
          title: 'Processing Payment',
          description: 'Payment is being processed securely',
          color: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'verifying':
        return {
          icon: <CreditCard className="h-5 w-5 text-purple-600" />,
          title: 'Verifying Payment',
          description: 'Confirming payment and updating balance',
          color: 'border-purple-200 bg-purple-50',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'completed':
        return {
          icon: <CheckCircle className={`h-5 w-5 text-green-600 ${animationClass}`} />,
          title: 'Payment Successful',
          description: 'Balance updated successfully',
          color: 'border-green-200 bg-green-50',
          badge: 'bg-green-100 text-green-800'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          title: 'Payment Failed',
          description: 'Payment could not be processed',
          color: 'border-red-200 bg-red-50',
          badge: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          title: 'Unknown Status',
          description: 'Please contact support',
          color: 'border-gray-200 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`${config.color} border`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm">{config.title}</h3>
              <Badge variant="secondary" className={`${config.badge} text-xs`}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mb-2">{config.description}</p>
            
            {amount && (
              <div className="text-lg font-semibold mb-1">
                ₦{parseFloat(amount).toLocaleString()}
              </div>
            )}
            
            {reference && (
              <div className="text-xs text-gray-500 font-mono break-all">
                Ref: {reference}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}