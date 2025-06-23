import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method: string, url: string, data?: any) {
  const token = localStorage.getItem("digipay_token");

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers = {
      ...config.headers,
      "Authorization": `Bearer ${token}`,
    };
  }

  console.log(`API Request: ${method} ${url}`, { hasToken: !!token });

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem("digipay_token");
      window.location.href = "/auth";
      throw new Error("Unauthorized");
    }

    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response;
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
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(queryKey[0] as string, {
          headers,
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        return res.json();
      },
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: false,
    },
  },
});