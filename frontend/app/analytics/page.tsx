"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { YieldChart } from "@/components/charts/YieldChart";
import { useMounted } from "@/hooks/useMounted";

export default function AnalyticsPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();

  // Mock chart data
  const cashFlowData = [
    { period: 1, rent: 10000, expenses: 3000, distributable: 7000 },
    { period: 2, rent: 10000, expenses: 3500, distributable: 6500 },
    { period: 3, rent: 10000, expenses: 3000, distributable: 7000 },
    { period: 4, rent: 10000, expenses: 4000, distributable: 6000 },
    { period: 5, rent: 10000, expenses: 3000, distributable: 7000 },
  ];

  const yieldData = [
    { period: 1, rentalYield: 7000, defiYield: 0, total: 7000 },
    { period: 2, rentalYield: 6500, defiYield: 500, total: 7000 },
    { period: 3, rentalYield: 7000, defiYield: 1000, total: 8000 },
    { period: 4, rentalYield: 6000, defiYield: 1200, total: 7200 },
    { period: 5, rentalYield: 7000, defiYield: 1500, total: 8500 },
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>Please connect your wallet to view analytics</CardDescription>
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
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive financial analytics and insights</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends</CardTitle>
                <CardDescription>Rent, expenses, and distributable cash flow over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CashFlowChart data={cashFlowData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yield Breakdown</CardTitle>
                <CardDescription>Rental yield vs DeFi yield by period</CardDescription>
              </CardHeader>
              <CardContent>
                <YieldChart data={yieldData} />
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg Monthly Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">$10,000</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">$3,300</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg Distributable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">$6,700</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg DeFi Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">$840</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

