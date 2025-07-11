'use server'

import { auth } from "@clerk/nextjs/server";

export const authUser = async (): Promise<string | null> => {
  const { userId, getToken } = await auth();
  const clerkToken = await getToken();
  if (!clerkToken || !userId) return null;

  // Exchange Clerk JWT for backend JWT
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      role: "user",
    }),
  });

  if (!res.ok) return null;
  const backendToken = res.headers.get("expense_token");
  if (backendToken) {
    localStorage.setItem("expense_token", backendToken);
  }
  return backendToken;
};