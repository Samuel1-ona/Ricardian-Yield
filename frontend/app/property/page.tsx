"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

export default function PropertyPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();

  // Mock property data
  const property = {
    location: "123 Main St, San Francisco, CA",
    valuation: BigInt(1000000) * BigInt(10) ** BigInt(18),
    monthlyRent: BigInt(10000) * BigInt(10) ** BigInt(18),
    propertyId: 0,
  };

  const stats = {
    totalRentCollected: BigInt(50000) * BigInt(10) ** BigInt(18),
    operatingExpenses: BigInt(15000) * BigInt(10) ** BigInt(18),
    workingCapitalReserve: BigInt(5000) * BigInt(10) ** BigInt(18),
    capexSpent: BigInt(20000) * BigInt(10) ** BigInt(18),
    distributableCashFlow: BigInt(35000) * BigInt(10) ** BigInt(18),
  };

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
                <CardDescription>Please connect your wallet to view property details</CardDescription>
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Property Overview</h1>
            <p className="text-gray-600">Detailed view of your tokenized property</p>
          </div>

          {/* Property Header */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{property.location}</CardTitle>
              <CardDescription>Property ID: {property.propertyId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valuation</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(property.valuation)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(property.monthlyRent)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Annual Yield</p>
                  <p className="text-2xl font-bold text-primary">
                    {((Number(property.monthlyRent) * 12 / Number(property.valuation)) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rent Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalRentCollected)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operating Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(stats.operatingExpenses)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distributable Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{formatCurrency(stats.distributableCashFlow)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Breakdown</CardTitle>
                <CardDescription>Income and expenses breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rent Collected</span>
                    <span className="font-semibold text-foreground">{formatCurrency(stats.totalRentCollected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Operating Expenses</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(stats.operatingExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Working Capital Reserve</span>
                    <span className="font-semibold text-gray-500">-{formatCurrency(stats.workingCapitalReserve)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <span className="font-semibold text-foreground">Distributable Cash Flow</span>
                    <span className="font-bold text-primary text-xl">{formatCurrency(stats.distributableCashFlow)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capital Expenditures</CardTitle>
                <CardDescription>Long-term value creation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total CapEx Spent</span>
                    <span className="font-semibold text-foreground">{formatCurrency(stats.capexSpent)}</span>
                  </div>
                  <div className="bg-primary-light rounded-lg p-4">
                    <p className="text-sm text-primary-dark">
                      CapEx affects property value but is excluded from immediate yield distribution,
                      showing long-term value creation.
                    </p>
                  </div>
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
