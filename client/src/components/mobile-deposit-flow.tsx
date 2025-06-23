import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Smartphone, Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface MobileDepositFlowProps {
  amount: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function MobileDepositFlow({ amount, onComplete, onCancel }: MobileDepositFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const paymentMethods = [
    {
      id: 'card',
      name: 'Debit Card',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Instant payment with your bank card',
      processingTime: 'Instant',
      recommended: true
    },
    {
      id: 'transfer',
      name: 'Bank Transfer',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Transfer from your mobile banking app',
      processingTime: '1-2 minutes',
      recommended: false
    },
    {
      id: 'ussd',
      name: 'USSD Code',
      icon: <span className="text-xs font-bold">*737#</span>,
      description: 'Dial from your phone without internet',
      processingTime: '1-2 minutes',
      recommended: false
    }
  ];

  const steps = [
    { id: 1, title: 'Choose Method', description: 'Select your preferred payment method' },
    { id: 2, title: 'Complete Payment', description: 'Securely pay with Paystack' },
    { id: 3, title: 'Confirmation', description: 'Payment verified and credited' }
  ];

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep >= step.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {currentStep > step.id ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-2
                ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Payment Method</CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount to deposit</span>
              <Badge variant="secondary" className="text-lg font-semibold">
                ₦{parseFloat(amount).toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`
                  relative p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedMethod === method.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedMethod(method.id)}
              >
                {method.recommended && (
                  <Badge className="absolute top-2 right-2 text-xs">Recommended</Badge>
                )}
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 mt-1">{method.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{method.processingTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                All payments are secured by Paystack with bank-level encryption
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedMethod && setCurrentStep(2)}
                disabled={!selectedMethod}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complete Payment</CardTitle>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Selected method</span>
              <Badge variant="outline">
                {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Secure Payment</span>
              </div>
              <p className="text-sm text-blue-800">
                You'll be redirected to Paystack's secure payment page to complete your transaction.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₦{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Do not close this window during payment. You'll be redirected back automatically.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  // This would trigger the actual payment
                  setCurrentStep(3);
                  setTimeout(onComplete, 2000);
                }}
                className="flex-1"
              >
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardContent className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-800">Payment Successful!</h3>
              <p className="text-gray-600 mt-2">
                ₦{parseFloat(amount).toLocaleString()} has been added to your wallet
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Your account balance will be updated within seconds. You can now start trading!
              </p>
            </div>
            <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
              Continue to Trading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}