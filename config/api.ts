// lib/api.ts
'use client'


// for pages router use: import { useAuth } from "@clerk/nextjs";

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("fetchWithAuth can only be used on the client side");
  }
  const token = localStorage.getItem("expense_token");
  
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${res.status} - ${error}`);
  }

  return res.json();
}
