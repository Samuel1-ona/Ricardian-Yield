"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";

// Force dynamic rendering - this page depends on wallet state
export const dynamic = 'force-dynamic';

export default function RentPage() {
  const { address, isConnected } = useAccount();
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  // Mock data
  const rentHistory = [
    { period: 3, amount: BigInt(10000) * BigInt(10) ** BigInt(18), date: "2024-01-15" },
    { period: 2, amount: BigInt(10000) * BigInt(10) ** BigInt(18), date: "2023-12-15" },
    { period: 1, amount: BigInt(10000) * BigInt(10) ** BigInt(18), date: "2023-11-15" },
  ];

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsDepositing(true);
      // TODO: Implement actual contract interaction
      toast.success("Rent deposited successfully!");
      setAmount("");
    } catch (error) {
      toast.error("Failed to deposit rent");
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Please connect your wallet to deposit rent</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50 relative pattern-dots">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Deposit Rent</h1>
            <p className="text-gray-600 font-light text-lg">Record a new rent payment</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deposit Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>New Rent Payment</CardTitle>
                  <CardDescription>Enter the rent amount in USDC</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  <div className="bg-primary-light rounded-lg p-4">
                    <p className="text-sm text-primary-dark">
                      <strong>Note:</strong> You'll need to approve USDC spending first, then deposit the rent.
                      The system will automatically stack idle funds into DeFi vaults.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleDeposit}
                      isLoading={isDepositing}
                    >
                      {isApproving ? "Approve USDC" : "Deposit Rent"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Recent rent deposits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rentHistory.map((payment, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-foreground">Period {payment.period}</p>
                            <p className="text-sm text-gray-500">{payment.date}</p>
                          </div>
                          <p className="font-semibold text-primary">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
