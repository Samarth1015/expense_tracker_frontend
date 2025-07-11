"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchWithAuth } from "../../../config/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
// import { loginWithClerk } from "@/helper/auth/loginWithClerk";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

// Expense type
interface Expense {
  id: number; // <-- Added for update/delete
  amount: number;
  category: string;
  date: string;
  description: string;
}

// Helper to convert date to backend format
function toBackendDate(dateStr: string) {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr;
  return dateStr + "T00:00:00Z";
}

interface GraphDatum {
  month: string;
  total: number;
}

function Loading() {
  return (
    <div className="flex justify-center items-center h-40">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );
}

export default function Inner() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, userId } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", date: "", description: "" });
  const [prompt, setPrompt] = useState("");
  const [promptResult, setPromptResult] = useState<Expense[]>([]);
  const [graphData, setGraphData] = useState<GraphDatum[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  // Edit modal states
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", category: "", date: "", description: "" });
  // Date range and month filter states for All Expenses
  const [allStartDate, setAllStartDate] = useState("");
  const [allEndDate, setAllEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  // Track when expense_token is ready
  const [expenseTokenReady, setExpenseTokenReady] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/protected/expense", { method: "GET" });
      setExpenses(res.data || res);
      setGraphData(makeGraphData(res.data || res));
    } catch {
      setExpenses([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log("runninggggggggg");
    if (!isLoaded || !isSignedIn || !user) return;

    getToken().then(async (clerkToken: string | null) => {
      if (!clerkToken) return;
      // const userInfo = {
      //   userId: user.id,
      //   username: user.username || user.fullName || "",
      //   email: user.primaryEmailAddress?.emailAddress || "",
      //   role: "user",
      // };
      if (!localStorage.getItem("expense_token")) {
        try {
          // await loginWithClerk(userInfo, clerkToken);
        } catch {
          // Optionally handle error
        }
      }
    });
  }, [isLoaded, isSignedIn, user, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      toast.error("Please sign in to continue");
      router.push("/");
      return;
    }
    // Only fetch expenses after expense_token is ready
    if (localStorage.getItem("expense_token") || expenseTokenReady) {
      fetchExpenses();
    }
  }, [isLoaded, isSignedIn, fetchExpenses, router, expenseTokenReady]);

  // Update graph data when date range or expenses change
  useEffect(() => {
    setGraphData(makeGraphData(expenses, startDate, endDate));
  }, [expenses, startDate, endDate]);

  useEffect(() => {
    (async () => {
      console.log("-----------> env base api url ",process.env.NEXT_PUBLIC_BASE_URL)
      if (!isLoaded || !isSignedIn || !user) return;
      const clerkToken = await getToken();
      if (!clerkToken) {
        router.push("/");
        return;
      }
      if (!userId) {
        router.push("/");
        return;
      }
      // Prepare user info as in the curl
      const userInfo = {
        userid: user?.id,
        username: user?.username || user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        role: "user",
      };
      const url = process.env.NEXT_PUBLIC_BASE_URL + "/api/auth/login";
      console.log("DEBUG: Fetching", url, userInfo);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      });

      console.log(res);
      console.log(res.headers);
      console.log("DEBUG: login response status", res.status);
      const expenseToken = res.headers.get("Expense_token");
      console.log("DEBUG: expense_token header", expenseToken);

      if (!res.ok) {
        console.log("DEBUG: Backend response not ok, redirecting");
        router.push("/");
        return;
      }

      if (expenseToken) {
        localStorage.setItem("expense_token", expenseToken);
        console.log("DEBUG: expense_token stored in localStorage");
        setExpenseTokenReady(true);
      } else {
        console.log("DEBUG: expense_token header missing, redirecting");
        router.push("/");
      }
    })();
  }, [getToken, userId, router, user, isLoaded, isSignedIn]);

  function makeGraphData(expenses: Expense[], start?: string, end?: string): GraphDatum[] {
    const byMonth: Record<string, number> = {};
    expenses?.forEach((expense) => {
      if (start && expense.date < start) return;
      if (end && expense.date > end) return;
      const month = expense.date?.slice(0, 7) || "Unknown";
      byMonth[month] = (byMonth[month] || 0) + (expense.amount || 0);
    });
    return Object.entries(byMonth).map(([month, total]) => ({ month, total }));
  }

  async function handleAddExpense() {
    try {
      // Ensure amount is sent as a number
      const expenseData = {
        ...form,
        amount: Number(form.amount),
        date: form.date,
      };
      await fetchWithAuth("/api/protected/expense", {
        method: "POST",
        body: JSON.stringify([expenseData]),
      });
      setShowAdd(false);
      setForm({ amount: "", category: "", date: "", description: "" });
      fetchExpenses();
    } catch {}
  }

  async function handlePrompt() {
    try {
      const res = await fetchWithAuth("/api/protected/prompt", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setPromptResult(res.data || []);
    } catch {}
  }

  async function handleAddPromptExpenses() {
    try {
      await fetchWithAuth("/api/protected/expense", {
        method: "POST",
        body: JSON.stringify(promptResult),
      });
      setShowPrompt(false);
      setPrompt("");
      setPromptResult([]);
      fetchExpenses();
    } catch {}
  }

  async function handleDeleteExpense(expense_id: number) {
    // Instantly update UI
    setExpenses(prev => prev.filter(e => e.id !== expense_id));
    try {
      await fetchWithAuth(`/api/protected/expense/${expense_id}`, {
        method: "DELETE",
      });
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  function openEditModal(expense: Expense) {
    setEditExpense(expense);
    setEditForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      description: expense.description,
    });
  }

  async function handleUpdateExpense() {
    if (!editExpense) return;
    // Instantly update UI
    setExpenses(prev => prev.map(e =>
      e.id === editExpense.id
        ? { ...e, ...editForm, amount: Number(editForm.amount) }
        : e
    ));
    setEditExpense(null);
    try {
      await fetchWithAuth(`/api/protected/expense`, {
        method: "PUT",
        body: JSON.stringify({
          expense_id: editExpense.id,
          amount: Number(editForm.amount),
          category: editForm.category,
          date: toBackendDate(editForm.date),
          description: editForm.description,
        }),
      });
      toast.success("Expense updated");
    } catch {
      toast.error("Failed to update expense");
    }
  }

  // Filtered expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesText =
      expense.category.toLowerCase().includes(searchText.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchText.toLowerCase());
    const min = minAmount ? Number(minAmount) : -Infinity;
    const max = maxAmount ? Number(maxAmount) : Infinity;
    const inRange = expense.amount >= min && expense.amount <= max;
    // Date range filter
    const inDateRange = (!allStartDate || expense.date >= allStartDate) && (!allEndDate || expense.date <= allEndDate);
    // Month filter (YYYY-MM)
    const inMonth = !selectedMonth || expense.date.slice(0, 7) === selectedMonth;
    return matchesText && inRange && inDateRange && inMonth;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex flex-col">
      <div className="max-w-5xl mx-auto py-8 px-2 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome, {user?.fullName || user?.username || "User"}</h1>
            <p className="text-muted-foreground">Track your expenses and manage your budget smartly.</p>
          </div>
          <SignOutButton>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem("expense_token");
              setExpenseTokenReady(false);
              router.push("/");
            }}>Sign Out</Button>
          </SignOutButton>
        </div>
        <div className="flex gap-4 mb-6 flex-wrap">
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowAdd(true)}>+ Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <Input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                <Input placeholder="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <Button className="w-full mt-2" onClick={handleAddExpense}>Add</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogTrigger asChild>
              <Button variant="secondary" onClick={() => setShowPrompt(true)}>+ Add by Prompt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expenses by Prompt</DialogTitle>
              </DialogHeader>
              <Textarea placeholder="e.g. I spent 100 on icecream and 1000 on chips" value={prompt} onChange={e => setPrompt(e.target.value)} />
              <Button className="w-full mt-2" onClick={handlePrompt}>Parse Prompt</Button>
              {promptResult.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Parsed Expenses</h3>
                  <div className="mb-2 flex flex-col gap-2">
                    {promptResult.map((expense, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          className="w-20"
                          type="number"
                          value={expense.amount}
                          onChange={e => {
                            const val = e.target.value;
                            setPromptResult(prev => prev.map((ex, idx) => idx === i ? { ...ex, amount: Number(val) } : ex));
                          }}
                          placeholder="Amount"
                        />
                        <Input
                          className="w-32"
                          value={expense.category}
                          onChange={e => {
                            const val = e.target.value;
                            setPromptResult(prev => prev.map((ex, idx) => idx === i ? { ...ex, category: val } : ex));
                          }}
                          placeholder="Category"
                        />
                        <Input
                          className="w-36"
                          type="date"
                          value={expense.date}
                          onChange={e => {
                            const val = e.target.value;
                            setPromptResult(prev => prev.map((ex, idx) => idx === i ? { ...ex, date: val } : ex));
                          }}
                          placeholder="Date"
                        />
                        <Input
                          className="flex-1"
                          value={expense.description}
                          onChange={e => {
                            const val = e.target.value;
                            setPromptResult(prev => prev.map((ex, idx) => idx === i ? { ...ex, description: val } : ex));
                          }}
                          placeholder="Description"
                        />
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" onClick={handleAddPromptExpenses}>Add All</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Expense Graph</h2>
          <div className="flex gap-4 mb-4 items-center">
            <label className="flex items-center gap-2">
              Start Date:
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              End Date:
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </label>
            <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); }}>Reset</Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-4 p-6 pb-0">All Expenses</h2>
          {/* Date Range and Month Filter UI */}
          <div className="flex gap-4 p-6 pt-0 pb-2 flex-wrap items-end">
            {/* <Input
              placeholder="Search category or description"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-64"
            />
            <Input
              placeholder="Min Amount"
              type="number"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              className="w-32"
            />
            <Input
              placeholder="Max Amount"
              type="number"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              className="w-32"
            /> */}
            {/* Date range filter */}
            <label className="flex items-center gap-2">
              Start Date:
              <Input type="date" value={allStartDate} onChange={e => setAllStartDate(e.target.value)} className="w-36" />
            </label>
            <label className="flex items-center gap-2">
              End Date:
              <Input type="date" value={allEndDate} onChange={e => setAllEndDate(e.target.value)} className="w-36" />
            </label>
            <Button variant="outline" onClick={() => { setAllStartDate(""); setAllEndDate(""); }}>Reset Date</Button>
            {/* Month filter */}
            <label className="flex items-center gap-2">
              Month:
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-36"
              />
            </label>
            <Button variant="outline" onClick={() => setSelectedMonth("")}>Reset Month</Button>
            <Button variant="outline" onClick={() => { setSearchText(""); setMinAmount(""); setMaxAmount(""); }}>Reset</Button>
          </div>
          {loading ? <Loading /> : (
            <div className="overflow-x-auto p-6 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center">No expenses found.</TableCell></TableRow>
                  ) : filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.amount}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="mr-2" onClick={() => openEditModal(expense)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        {/* Edit Expense Modal */}
        <Dialog open={!!editExpense} onOpenChange={open => { if (!open) setEditExpense(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input placeholder="Amount" type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              <Input placeholder="Category" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
              <Input placeholder="Date" type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              <Textarea placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              <Button className="w-full mt-2" onClick={handleUpdateExpense}>Update</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
