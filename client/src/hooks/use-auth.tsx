
import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  phone?: string;
  bvn?: string;
  tronAddress?: string;
  kycVerified: boolean;
  kycStatus?: string;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  kycRejectionReason?: string;
  nairaBalance: string;
  usdtBalance: string;
  averageRating: string;
  ratingCount: number;
  isOnline?: boolean;
  lastSeen?: string;
  isAdmin?: boolean;
  createdAt?: string;
  verified?: boolean;
  kycLevel?: number;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: {
    mutate: (data: { email: string; password: string }) => void;
    isPending: boolean;
  };
  registerMutation: {
    mutate: (data: { email: string; password: string }) => void;
    isPending: boolean;
  };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = localStorage.getItem("digipay_token");
      if (!token) return null;

      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("digipay_token");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Login success data:", data);
      if (data.token) {
        localStorage.setItem("digipay_token", data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        
        // Set a timeout to ensure token is stored before navigation
        setTimeout(() => {
          window.location.href = data.isAdmin ? "/admin" : "/marketplace";
        }, 100);
      }
    },
    onError: (error: any) => {
      console.log("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Register success data:", data);
      if (data.token) {
        localStorage.setItem("digipay_token", data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        // Force page reload to reset auth state
        window.location.href = "/profile-setup";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server if needed
      await apiRequest("POST", "/api/logout", {});
    } catch (error) {
      console.log("Server logout error:", error);
    }
    
    // Clear client-side data
    localStorage.removeItem("digipay_token");
    queryClient.clear();
    
    // Force page reload to completely reset auth state
    window.location.href = "/auth";
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    loginMutation: {
      mutate: loginMutation.mutate,
      isPending: loginMutation.isPending,
    },
    registerMutation: {
      mutate: registerMutation.mutate,
      isPending: registerMutation.isPending,
    },
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
