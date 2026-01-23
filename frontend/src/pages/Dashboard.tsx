import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Link } from "react-router-dom";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";
import { useRentCollected, useDistributableCashFlow, useCurrentPeriod } from "@/hooks/useStacksRead";

export default function DashboardPage() {
  const { isConnected, connect } = useStacks();
  const [propertyId] = useState(BigInt(1)); // TODO: Get from context or props
  const mounted = useMounted();

  // Get actual data from contracts
  const { rentCollected } = useRentCollected(propertyId);
  const { distributableCashFlow } = useDistributableCashFlow(propertyId);
  const { currentPeriod } = useCurrentPeriod(propertyId);

  // Format metrics (USDCx has 6 decimals)
  const metrics = {
    totalRentCollected: rentCollected || BigInt(0),
    distributableCashFlow: distributableCashFlow || BigInt(0),
    defiYieldEarned: BigInt(0), // Removed yield stacking
    totalAssetsInVault: BigInt(0), // Removed yield stacking
    currentPeriod: currentPeriod ? Number(currentPeriod) : 0,
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
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
              <Button onClick={connect} variant="primary" className="w-full">
                Connect Stacks Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-[#06B6D4]/3"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-600 font-light text-lg">Overview of your property and yield performance</p>
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
          <Card hover elevation={1}>
            <CardHeader>
              <CardTitle>Deposit Rent</CardTitle>
              <CardDescription>Record a new rent payment</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/rent">
                <Button variant="primary" className="w-full">
                  Deposit Rent
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card hover elevation={1}>
            <CardHeader>
              <CardTitle>Claim Yield</CardTitle>
              <CardDescription>Claim your proportional yield</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/yield">
                <Button variant="primary" className="w-full">
                  Claim Yield
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card hover elevation={1}>
            <CardHeader>
              <CardTitle>View Property</CardTitle>
              <CardDescription>See property details and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/property">
                <Button variant="outline" className="w-full">
                  View Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card elevation={1}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-gray-50 transition-material">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h1.125A2.25 2.25 0 0118 12.75v6.75a2.25 2.25 0 01-2.25 2.25H16.5v-4.5A2.25 2.25 0 0014.25 13h-1.5A2.25 2.25 0 0110.5 15.75v4.5H6A2.25 2.25 0 013.75 18v-6.75A2.25 2.25 0 016 9h1.5a3 3 0 013-3m0 0h3a3 3 0 013 3m-3-3v1.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Rent Deposit</p>
                    <p className="text-xs text-gray-500 font-light">Period {metrics.currentPeriod}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary text-sm">
                    {metrics.totalRentCollected > BigInt(0) 
                      ? `${(Number(metrics.totalRentCollected) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </p>
                  <p className="text-xs text-gray-500 font-light">Current period</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

