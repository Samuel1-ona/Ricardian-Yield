"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();

  // Mock data - will be replaced with actual contract calls
  const metrics = {
    totalRentCollected: BigInt(50000) * BigInt(10) ** BigInt(18),
    distributableCashFlow: BigInt(35000) * BigInt(10) ** BigInt(18),
    defiYieldEarned: BigInt(2500) * BigInt(10) ** BigInt(18),
    totalAssetsInVault: BigInt(15000) * BigInt(10) ** BigInt(18),
    currentPeriod: 3,
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
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
                <CardDescription>
                  Please connect your wallet to view the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Use the "Connect Wallet" button in the header to get started.
                </p>
              </CardContent>
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-gray-600">Overview of your property and yield performance</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Rent Collected"
              value={metrics.totalRentCollected}
              subtitle="All time"
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              title="Distributable Cash Flow"
              value={metrics.distributableCashFlow}
              subtitle="Available for distribution"
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <MetricCard
              title="DeFi Yield Earned"
              value={metrics.defiYieldEarned}
              subtitle="From yield stacking"
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <MetricCard
              title="Assets in Vault"
              value={metrics.totalAssetsInVault}
              subtitle="Principal + yield"
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card hover>
              <CardHeader>
                <CardTitle>Deposit Rent</CardTitle>
                <CardDescription>Record a new rent payment</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/rent">
                  <Button variant="primary" className="w-full">
                    Deposit Rent
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Claim Yield</CardTitle>
                <CardDescription>Claim your proportional yield</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/yield">
                  <Button variant="primary" className="w-full">
                    Claim Yield
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>View Property</CardTitle>
                <CardDescription>See property details and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/property">
                  <Button variant="outline" className="w-full">
                    View Property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Rent Deposit</p>
                      <p className="text-sm text-gray-500">Period {metrics.currentPeriod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{formatCurrency(BigInt(10000) * BigInt(10) ** BigInt(18))}</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Yield Claimed</p>
                      <p className="text-sm text-gray-500">Period {metrics.currentPeriod - 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{formatCurrency(BigInt(5000) * BigInt(10) ** BigInt(18))}</p>
                    <p className="text-sm text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

