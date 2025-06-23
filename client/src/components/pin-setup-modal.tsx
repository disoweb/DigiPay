import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinSetupModal({ isOpen, onClose, onSuccess }: PinSetupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const pinSetupMutation = useMutation({
    mutationFn: async (data: { pin: string }) => {
      const token = localStorage.getItem('digipay_token');
      const response = await fetch('/api/user/setup-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup PIN');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setStep(3);
      
      toast({
        title: "PIN Setup Complete",
        description: "Your transaction PIN has been set successfully",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup PIN",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setStep(1);
    setPin("");
    setConfirmPin("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!pin || pin.length !== 4) {
        toast({
          title: "Invalid PIN",
          description: "PIN must be exactly 4 digits",
          variant: "destructive",
        });
        return;
      }
      if (!/^\d{4}$/.test(pin)) {
        toast({
          title: "Invalid PIN",
          description: "PIN must contain only numbers",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (pin !== confirmPin) {
        toast({
          title: "PIN Mismatch",
          description: "PINs do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      pinSetupMutation.mutate({ pin });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto" aria-describedby="pin-setup-description">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Setup Transaction PIN
          </DialogTitle>
          <p id="pin-setup-description" className="sr-only">
            Set up a 4-digit PIN to secure your transactions
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Lock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700 font-medium">Secure Your Transactions</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Create a 4-digit PIN to authorize withdrawals and transfers
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Label>Create Transaction PIN</Label>
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 text-center">
                  Choose a memorable 4-digit number
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Keep your PIN secure and don't share it with anyone. You'll need this PIN for all withdrawals.
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Confirm your PIN</p>
              </div>

              <div className="space-y-3">
                <Label>Confirm Transaction PIN</Label>
                <Input
                  type="password"
                  placeholder="Re-enter 4-digit PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Re-enter your PIN to confirm it's correct
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800">PIN Setup Complete!</h3>
                <p className="text-sm text-gray-600">Your transaction PIN is now active</p>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                className="flex-1"
                disabled={pinSetupMutation.isPending}
              >
                {pinSetupMutation.isPending ? "Setting up..." : step === 1 ? "Continue" : "Complete Setup"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}