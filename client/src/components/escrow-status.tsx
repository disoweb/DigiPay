import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Trade } from "@shared/schema";

interface EscrowStatusProps {
  trade: Trade;
  userRole: 'buyer' | 'seller' | 'other';
  onReleaseEscrow?: () => void;
  onRefundEscrow?: () => void;
}

export function EscrowStatus({ trade, userRole, onReleaseEscrow, onRefundEscrow }: EscrowStatusProps) {
  const [escrowBalance, setEscrowBalance] = useState<number>(0);

  useEffect(() => {
    // Simulate checking escrow balance
    if (trade.escrowAddress) {
      setEscrowBalance(parseFloat(trade.amount));
    }
  }, [trade]);

  const getStatusIcon = () => {
    switch (trade.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (trade.status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const showControls = trade.status === "pending" && (userRole === 'seller' || userRole === 'buyer');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Escrow Protection</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Smart contract ensures secure fund transfer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Trade Amount</p>
            <p className="text-lg font-semibold">{parseFloat(trade.amount).toFixed(2)} USDT</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Exchange Rate</p>
            <p className="text-lg font-semibold">₦{parseFloat(trade.rate).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm capitalize">{trade.status}</span>
            </div>
          </div>
          
          {trade.escrowAddress && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Escrow Address</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                  {trade.escrowAddress}
                </code>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {escrowBalance > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Locked Amount</p>
              <p className="text-sm font-semibold text-green-600">
                {escrowBalance.toFixed(2)} USDT
              </p>
            </div>
          )}
        </div>

        {trade.status === "pending" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">How Escrow Works:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Seller's USDT is locked in smart contract</li>
                  <li>• Buyer pays Naira directly to seller's bank</li>
                  <li>• Seller confirms payment and releases USDT</li>
                  <li>• In case of dispute, admin can intervene</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {showControls && (
          <div className="flex space-x-2">
            {userRole === 'seller' && trade.status === 'pending' && (
              <Button 
                onClick={onReleaseEscrow} 
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Payment & Release
              </Button>
            )}
            {(userRole === 'buyer' || userRole === 'seller') && trade.status === 'pending' && (
              <Button 
                onClick={onRefundEscrow} 
                variant="destructive" 
                className="flex-1"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Trade
              </Button>
            )}
          </div>
        )}

        {trade.status === "completed" && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium text-green-700">
                Trade completed successfully! Funds have been released.
              </p>
            </div>
          </div>
        )}

        {trade.status === "cancelled" && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-red-700">
                Trade was cancelled and funds have been refunded.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}