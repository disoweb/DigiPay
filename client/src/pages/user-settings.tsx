
import { Navbar } from "@/components/navbar";
import { UserProfileSection } from "@/components/user-profile-section";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";

export default function UserSettings() {
  const { user, isLoading } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!user?.id,
  });

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

  // Calculate user statistics
  const completedTrades = trades.filter((t: any) => t.status === 'completed');
  const disputedTrades = trades.filter((t: any) => t.status === 'disputed');
  const successRate = trades.length > 0 
    ? (completedTrades.length / trades.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your trading profile and account settings
          </p>
        </div>

        <UserProfileSection 
          completedTrades={completedTrades.length}
          disputedTrades={disputedTrades.length}
          successRate={successRate}
        />
      </div>
    </div>
  );
}
