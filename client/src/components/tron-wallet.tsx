import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Copy, Send, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function TronWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sendAmount, setSendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  const { data: tronBalance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["/api/tron/balance"],
    enabled: !!user?.tronAddress,
  });

  const sendUSDTMutation = useMutation({
    mutationFn: async ({ amount, to }: { amount: string; to: string }) => {
      const res = await apiRequest("POST", "/api/tron/send", { amount, to });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "USDT Sent Successfully",
        description: "Your transaction has been broadcast to the TRON network.",
      });
      setSendAmount("");
      setRecipientAddress("");
      refetchBalance();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send USDT",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Address copied successfully",
    });
  };

  const handleSendUSDT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || !recipientAddress) {
      toast({
        title: "Invalid Input",
        description: "Please enter both amount and recipient address",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    sendUSDTMutation.mutate({ amount: sendAmount, to: recipientAddress });
  };

  // Remove KYC requirement for wallet access

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              TRON Wallet
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBalance()}
              disabled={balanceLoading}
            >
              <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* USDT Balance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">USDT Balance</p>
                <p className="text-2xl font-bold">
                  0.00 USDT
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                TRC-20
              </Badge>
            </div>
          </div>

          {/* Wallet Address */}
          <div>
            <Label className="text-sm font-medium">Your TRON Address</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                value={user?.tronAddress || ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(user?.tronAddress || "")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this address to receive USDT payments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Send USDT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Send USDT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendUSDT} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.000001"
                required
              />
            </div>

            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="TRON address (starting with T...)"
                className="font-mono"
                required
              />
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> TRON transactions are irreversible. 
                Please verify the recipient address carefully before sending.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={sendUSDTMutation.isPending || !sendAmount || !recipientAddress}
            >
              {sendUSDTMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send USDT
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}