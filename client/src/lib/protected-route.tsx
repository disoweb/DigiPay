import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
  adminOnly?: boolean;
  path?: string;
}

export function ProtectedRoute({ children, adminOnly = false, component: Component, ...props }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  console.log("ProtectedRoute - isLoading:", isLoading, "user:", !!user, "location:", location);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("No user found, redirecting to auth");
    setLocation('/auth');
    return null;
  }

  if (adminOnly && !user.isAdmin) {
    console.log("Admin access required but user is not admin");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page</p>
          <Button onClick={() => setLocation('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  console.log("User authenticated, rendering protected content");

  if (Component) {
    return <Component {...props} />;
  }

  return <>{children}</>;
}