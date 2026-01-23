import { Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";

// Lazy load heavy chart components for faster initial render
const CashFlowChart = lazy(() => import("@/components/charts/CashFlowChart").then(m => ({ default: m.CashFlowChart })));
const YieldChart = lazy(() => import("@/components/charts/YieldChart").then(m => ({ default: m.YieldChart })));

export default function AnalyticsPage() {
  const { isConnected, connect } = useStacks();
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
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
              <CardDescription>Please connect your wallet to view analytics</CardDescription>
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
    <main className="flex-1 bg-gray-50 relative pattern-dots">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#06B6D4]/5"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Analytics & Reports</h1>
          <p className="text-gray-600 font-light text-lg">Comprehensive financial analytics and insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trends</CardTitle>
              <CardDescription>Rent, expenses, and distributable cash flow over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>}>
                <CashFlowChart data={cashFlowData} />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yield Breakdown</CardTitle>
              <CardDescription>Rental yield vs DeFi yield by period</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>}>
                <YieldChart data={yieldData} />
              </Suspense>
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
  );
}

