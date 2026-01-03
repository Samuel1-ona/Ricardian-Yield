"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";

// Force dynamic rendering - this page depends on wallet state
export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data
  const expenses = [
    { id: 1, amount: BigInt(5000) * BigInt(10) ** BigInt(18), description: "Property maintenance", date: "2024-01-10" },
    { id: 2, amount: BigInt(3000) * BigInt(10) ** BigInt(18), description: "Insurance premium", date: "2024-01-05" },
    { id: 3, amount: BigInt(2000) * BigInt(10) ** BigInt(18), description: "Property taxes", date: "2024-01-01" },
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, BigInt(0));
  const workingCapitalReserve = BigInt(5000) * BigInt(10) ** BigInt(18);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement actual contract interaction
      toast.success("Expense recorded successfully!");
      setAmount("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to record expense");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>Please connect your wallet to record expenses</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50 relative pattern-grid">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Expense Management</h1>
            <p className="text-gray-600 font-light text-lg">Record and track operating expenses</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Expenses</CardTitle>
                <CardDescription>Current period</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Working Capital Reserve</CardTitle>
                <CardDescription>Safety buffer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(workingCapitalReserve)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expense Count</CardTitle>
                <CardDescription>This period</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{expenses.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Record Expense Form */}
            <Card>
              <CardHeader>
                <CardTitle>Record New Expense</CardTitle>
                <CardDescription>Add an operating expense</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Property maintenance"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  Record Expense
                </Button>
              </CardContent>
            </Card>

            {/* Expense History */}
            <Card>
              <CardHeader>
                <CardTitle>Expense History</CardTitle>
                <CardDescription>Recent operating expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">{expense.description}</p>
                          <p className="text-sm text-gray-500">{expense.date}</p>
                        </div>
                        <p className="font-semibold text-red-500">{formatCurrency(expense.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
