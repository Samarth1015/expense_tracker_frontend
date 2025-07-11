"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "../../../config/api";

interface Expense {
  amount: number;
  category: string;
  date: string;
  description: string;
}

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [parsed, setParsed] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetchWithAuth("/api/protected/prompt", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setParsed(res.data || []);
    } catch {
      setError("Failed to parse prompt.");
    }
    setLoading(false);
  }

  async function handleAdd() {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await fetchWithAuth("/api/protected/expense", {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      setSuccess(true);
      setParsed([]);
      setPrompt("");
    } catch {
      setError("Failed to add expenses.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-2">
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-4">Add Expenses by Prompt</h1>
        <Textarea
          placeholder="e.g. I spent 100 on icecream and 1000 on chips"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="mb-4"
          rows={4}
        />
        <Button className="w-full mb-4" onClick={handleParse} disabled={loading || !prompt}>
          {loading ? "Parsing..." : "Parse Prompt"}
        </Button>
        {parsed.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold mb-2">Parsed Expenses</h2>
            <ul className="mb-2">
              {parsed.map((expense, i) => (
                <li key={i} className="text-sm">{expense.amount} - {expense.category} - {expense.date} - {expense.description}</li>
              ))}
            </ul>
            <Button className="w-full" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "Add All"}
            </Button>
          </div>
        )}
        {success && <div className="text-green-600 font-medium mt-2">Expenses added successfully!</div>}
        {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      </Card>
    </div>
  );
}