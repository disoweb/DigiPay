import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Hash, Calendar, User, CreditCard, DollarSign, Copy } from "lucide-react";

interface Transaction {
  id: number;
  amount: string;
  type: string;
  status: string;
  createdAt: string;
  paystackRef?: string;
  paymentMethod?: string;
  adminNotes?: string;
}

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
      <DialogContent className="w-[90vw] max-w-sm mx-auto max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            {transaction.type === "deposit" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {/* Amount and Status - Compact */}
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                ₦{parseFloat(transaction.amount).toLocaleString()}
              </div>
              <Badge
                className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(transaction.status)}`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>

            {/* Transaction Information - Compact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="h-3 w-3" />
                  <span className="text-xs">ID</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">#{transaction.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.id.toString(), "Transaction ID")}
                    className="h-5 w-5 p-0 hover:bg-gray-100"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Date</span>
                </div>
                <span className="text-xs font-medium text-right">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-3 w-3" />
                  <span className="text-xs">Type</span>
                </div>
                <span className="text-xs font-medium capitalize">
                  {transaction.type}
                </span>
              </div>

              {transaction.paystackRef && (
                <div className="flex items-center justify-between py-1.5 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-xs">Ref</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium font-mono">
                      {transaction.paystackRef.slice(-8)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.paystackRef!, "Payment Reference")}
                      className="h-5 w-5 p-0 hover:bg-gray-100"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              )}

              {transaction.paymentMethod && (
                <div className="flex items-center justify-between py-1.5 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Method</span>
                  </div>
                  <span className="text-xs font-medium capitalize">
                    {transaction.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
              )}

              {transaction.adminNotes && (
                <div className="py-1.5">
                  <div className="text-gray-600 text-xs mb-1">Notes:</div>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    {transaction.adminNotes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pt-3 border-t">
          <Button onClick={onClose} className="w-full h-9 text-sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}