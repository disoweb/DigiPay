import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API request utility
export async function apiRequest(method: string, url: string, data?: any) {
  const token = localStorage.getItem('token');

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