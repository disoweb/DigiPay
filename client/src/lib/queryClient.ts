import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method: string, url: string, data?: any) {
  try {
    const token = localStorage.getItem("digipay_token");

    if (!token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      console.log("No auth token found for protected route");
      throw new Error("No authentication token");
    }

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (response.status === 401 && token) {
      console.log("Token expired, clearing and redirecting");
      localStorage.removeItem("digipay_token");
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = "/auth";
      }
      throw new Error("Unauthorized");
    }

    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('digipay_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem('digipay_token');
        const url = queryKey[0] as string;
        
        // Skip auth check for non-protected endpoints
        if (!token && !url.includes('/auth/')) {
          throw new Error('No authentication token');
        }
        
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          headers,
          credentials: "include",
        });

        if (res.status === 401 && token) {
          localStorage.removeItem('digipay_token');
          if (!window.location.pathname.includes('/auth')) {
            window.location.href = "/auth";
          }
          throw new Error('Authentication expired');
        }

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        return res.json();
      },
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error.message.includes('authentication') || error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: false,
    },
  },
});