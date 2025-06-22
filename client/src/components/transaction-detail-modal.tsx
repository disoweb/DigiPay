import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, TrendingUp, TrendingDown, Calendar, Hash, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, isOpen, onClose }: TransactionDetailModalProps) {
  const { toast } = useToast();

  if (!transaction) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transaction.type === "deposit" ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Type and Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 p-3 rounded-full ${
                  transaction.type === "deposit" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {transaction.type === "deposit" ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <h3 className="font-semibold text-lg mt-2 capitalize">
                  {transaction.type}
                </h3>
                <p className={`text-2xl font-bold mt-1 ${
                  transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "deposit" ? "+" : "-"}₦{parseFloat(transaction.amount).toLocaleString()}
                </p>
                <Badge className={getStatusColor(transaction.status)} variant="outline">
                  {transaction.status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Transaction ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">#{transaction.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.id.toString(), "Transaction ID")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Date & Time</span>
              </div>
              <span className="text-sm font-medium">
                {formatDate(transaction.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Amount</span>
              </div>
              <span className="text-sm font-medium">
                ₦{parseFloat(transaction.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Status</span>
              </div>
              <Badge className={getStatusColor(transaction.status)} variant="outline">
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>

            {transaction.paystackRef && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm">Payment Reference</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs truncate max-w-[120px]">
                    {transaction.paystackRef}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.paystackRef || "", "Payment Reference")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {transaction.paymentMethod && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Payment Method</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {transaction.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            )}

            {transaction.adminNotes && (
              <div className="py-2">
                <div className="text-gray-600 text-sm mb-1">Admin Notes:</div>
                <div className="text-sm bg-gray-50 p-2 rounded">
                  {transaction.adminNotes}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}