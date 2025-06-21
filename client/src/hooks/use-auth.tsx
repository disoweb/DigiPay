
import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  verified: boolean;
  kycLevel: number;
  nairaBalance: string;
  usdtBalance: string;
  averageRating: string;
  ratingCount: number;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
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
      const response = await apiRequest("POST", "/api/login", data);
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("digipay_token", data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      setLocation("/dashboard");
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
      const response = await apiRequest("POST", "/api/register", data);
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("digipay_token", data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/profile-setup");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem("digipay_token");
    queryClient.clear();
    setLocation("/auth");
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
