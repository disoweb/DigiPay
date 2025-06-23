import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API request helper with auth token
export async function apiRequest(method: string, url: string, data?: any): Promise<Response> {
  const token = localStorage.getItem('digipay_token') || localStorage.getItem('auth_token');

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
}