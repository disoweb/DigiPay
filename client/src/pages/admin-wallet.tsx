import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { AdminWalletManagement } from "@/components/admin-wallet-management";
import { Redirect } from "wouter";

export default function AdminWallet() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Wallet Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Credit or debit user accounts instantly
          </p>
        </div>

        <AdminWalletManagement />
      </div>
    </div>
  );
}