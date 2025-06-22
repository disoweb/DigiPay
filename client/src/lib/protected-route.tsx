import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
  adminOnly?: boolean;
  path?: string;
}

export function ProtectedRoute({ 
  component: Component, 
  children,
  adminOnly = false,
  ...props 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Add a small delay to prevent redirect loops during initial load
    const timer = setTimeout(() => {
      if (!isLoading && !user) {
        setLocation("/auth");
      } else if (!isLoading && user && adminOnly && !user.isAdmin) {
        setLocation("/dashboard");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading, adminOnly, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (adminOnly && !user.isAdmin) {
    return null;
  }

  if (Component) {
    return <Component {...props} />;
  }
  
  return <>{children}</>;
}