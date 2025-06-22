import { Navbar } from "@/components/navbar";
import { AdminKYCReview } from "@/components/admin-kyc-review";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminKYC() {
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
            KYC Verification Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Review and manage user identity verification requests
          </p>
        </div>

        <AdminKYCReview />
      </div>
    </div>
  );
}