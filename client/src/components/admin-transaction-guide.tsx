import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Wallet,
  Plus,
  Minus,
  AlertCircle,
  Info
} from "lucide-react";

export function AdminTransactionGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Admin Transaction Management Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Wallet Management Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Wallet Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Credit User Account</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Add NGN or USDT to any user's wallet instantly
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Navigate to Admin → Wallet</div>
                    <div>• Search for user</div>
                    <div>• Click "Credit" button</div>
                    <div>• Enter amount, currency, and description</div>
                    <div>• Changes reflect immediately</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Debit User Account</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Remove NGN or USDT from any user's wallet
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>• Navigate to Admin → Wallet</div>
                    <div>• Search for user</div>
                    <div>• Click "Debit" button</div>
                    <div>• Enter amount, currency, and description</div>
                    <div>• System prevents negative balances</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transaction CRUD Operations */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Transaction CRUD Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">View Details</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    View complete transaction information
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Click the eye icon on any transaction</div>
                    <div>• View user details, amounts, dates</div>
                    <div>• See bank details for withdrawals</div>
                    <div>• Check admin notes and status</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Edit Transaction</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Modify any transaction details
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Click the edit icon</div>
                    <div>• Change amount, status, type</div>
                    <div>• Update bank details</div>
                    <div>• Add admin notes</div>
                    <div>• Auto-adjusts user balance</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Delete Transaction</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Remove transactions with balance correction
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Click the delete icon</div>
                    <div>• Confirm deletion</div>
                    <div>• Auto-reverses balance effects</div>
                    <div>• Prevents negative balances</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Approval Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approval Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Approve Transactions</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Approve pending transactions
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Only available for pending transactions</div>
                    <div>• Click green checkmark icon</div>
                    <div>• Add optional admin notes</div>
                    <div>• Updates status to approved</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Reject Transactions</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Reject pending transactions with reason
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>• Only available for pending transactions</div>
                    <div>• Click red X icon</div>
                    <div>• Must provide rejection reason</div>
                    <div>• Updates status to rejected</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation Steps */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              How to Access Admin Features
            </h3>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">1</Badge>
                  <div>
                    <div className="font-medium">Access Admin Dashboard</div>
                    <div className="text-sm text-gray-600">Navigate to Admin → Users, Wallet, or Approvals from the top navigation</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">2</Badge>
                  <div>
                    <div className="font-medium">For Wallet Operations</div>
                    <div className="text-sm text-gray-600">Go to Admin → Wallet, search for user, and use Credit/Debit buttons</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">3</Badge>
                  <div>
                    <div className="font-medium">For Transaction Management</div>
                    <div className="text-sm text-gray-600">Go to Admin → Approvals, find transaction, and use the action buttons</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">4</Badge>
                  <div>
                    <div className="font-medium">Action Icons</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> View</span>
                      <span className="flex items-center gap-1"><Edit className="h-3 w-3" /> Edit</span>
                      <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approve</span>
                      <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Reject</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Built-in Safety Features
            </h3>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-amber-800 mb-2">Balance Protection</div>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Prevents negative balances</li>
                    <li>• Auto-calculates balance changes</li>
                    <li>• Validates sufficient funds</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-amber-800 mb-2">Transaction Integrity</div>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Automatic balance reconciliation</li>
                    <li>• Audit trail for all changes</li>
                    <li>• Confirmation dialogs for deletions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}