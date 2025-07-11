export async function loginWithClerk(user: { userId: string, username: string, email: string, role?: string }, clerkToken: string) {
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${clerkToken}`,
    },
    body: JSON.stringify(user),
  });

  const expenseToken = res.headers.get("expense_token");
  if (expenseToken) {
    localStorage.setItem("expense_token", expenseToken);
    return true;
  } else {
    throw new Error("No expense_token received from backend");
  }
} 