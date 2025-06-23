import { createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  bvn: string;
  tronAddress: string;
  kycVerified: boolean;
  kycStatus: string;
  nairaBalance: string;
  usdtBalance: string;
  averageRating: string;
  ratingCount: number;
  isOnline: boolean;
  lastSeen: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  fundsFrozen: boolean;
  freezeReason: string | null;
  frozenAt: string | null;
  isFeatured: boolean;
  featuredPriority: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
  loginMutation: any;
  registerMutation: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch: refetchUser, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("digipay_token") || localStorage.getItem("auth_token");
        if (!token) {
          console.log("No auth token found");
          return null;
        }

        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("Token expired or invalid, clearing storage");
            localStorage.removeItem("digipay_token");
            localStorage.removeItem("auth_token");
            throw new Error("Unauthorized");
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        console.log("User data loaded successfully:", { id: userData.id, email: userData.email });
        return userData;
      } catch (err: any) {
        console.error("User data fetch error:", err);
        if (err.message === "Unauthorized") {
          localStorage.removeItem("digipay_token");
          localStorage.removeItem("auth_token");
        }
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.message === "Unauthorized" || error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle auth errors
  useEffect(() => {
    if (error && error.message === "Unauthorized") {
      console.log("Auth error detected, redirecting to login");
      if (location !== "/auth") {
        navigate("/auth");
      }
    }
  }, [error, location, navigate]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", { email, password });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}: Login failed`);
        }

        if (!data.token) {
          throw new Error("No authentication token received");
        }

        return data;
      } catch (error: any) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        console.log("Login success, storing token");
        localStorage.setItem("digipay_token", data.token);
        queryClient.setQueryData(["user"], data);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.firstName || data.username}!`,
        });

        navigate("/dashboard");
      } catch (error) {
        console.error("Login success handler error:", error);
        toast({
          title: "Login Error",
          description: "Login succeeded but there was an issue. Please refresh the page.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (error) {
      // Error is already handled in onError
      throw error;
    }
  };

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, phone, bvn }: { email: string; password: string; phone: string; bvn: string }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/register", { email, password, phone, bvn });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}: Registration failed`);
        }

        if (!data.token) {
          throw new Error("No authentication token received");
        }

        return data;
      } catch (error: any) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        console.log("Registration success, storing token");
        localStorage.setItem("digipay_token", data.token);
        queryClient.setQueryData(["user"], data);

        toast({
          title: "Registration Successful",
          description: `Welcome to DigiPay, ${data.firstName || data.username}!`,
        });

        navigate("/profile-setup");
      } catch (error) {
        console.error("Registration success handler error:", error);
        toast({
          title: "Registration Error",
          description: "Registration succeeded but there was an issue. Please refresh the page.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    try {
      console.log("Logging out user");
      localStorage.removeItem("digipay_token");
      localStorage.removeItem("auth_token");
      queryClient.clear();
      navigate("/auth");

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation even if there's an error
      navigate("/auth");
    }
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    login,
    logout,
    refetchUser: () => {
      try {
        refetchUser();
      } catch (error) {
        console.error("Refetch user error:", error);
      }
    },
    loginMutation,
    registerMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```