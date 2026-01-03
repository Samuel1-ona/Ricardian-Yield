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

export default function YieldPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Mock data
  const periods = [
    {
      period: 3,
      distributable: BigInt(35000) * BigInt(10) ** BigInt(18),
      rentalYield: BigInt(30000) * BigInt(10) ** BigInt(18),
      defiYield: BigInt(5000) * BigInt(10) ** BigInt(18),
      claimable: BigInt(3500) * BigInt(10) ** BigInt(18),
      claimed: false,
    },
    {
      period: 2,
      distributable: BigInt(32000) * BigInt(10) ** BigInt(18),
      rentalYield: BigInt(28000) * BigInt(10) ** BigInt(18),
      defiYield: BigInt(4000) * BigInt(10) ** BigInt(18),
      claimable: BigInt(0),
      claimed: true,
    },
    {
      period: 1,
      distributable: BigInt(30000) * BigInt(10) ** BigInt(18),
      rentalYield: BigInt(30000) * BigInt(10) ** BigInt(18),
      defiYield: BigInt(0),
      claimable: BigInt(0),
      claimed: true,
    },
  ];

  const handleClaim = async (period: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      // TODO: Implement actual contract interaction
      toast.success(`Yield for period ${period} claimed successfully!`);
    } catch (error) {
      toast.error("Failed to claim yield");
      console.error(error);
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
                <CardDescription>Please connect your wallet to view and claim yield</CardDescription>
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
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#06B6D4]/10 to-primary/10 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Yield Distribution</h1>
            <p className="text-gray-600 font-light text-lg">View and claim your proportional yield</p>
          </div>

          {/* Total Claimable */}
          <Card className="mb-8 bg-gradient-to-br from-primary/10 via-white to-[#06B6D4]/10 border-0 elevation-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-[#06B6D4]/20 rounded-full blur-2xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl">Total Claimable Yield</CardTitle>
              <CardDescription>Available across all periods</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-4xl font-light text-primary tracking-tight">
                {formatCurrency(periods.reduce((sum, p) => sum + p.claimable, BigInt(0)))}
              </p>
            </CardContent>
          </Card>

          {/* Periods List */}
          <div className="space-y-4">
            {periods.map((periodData) => (
              <Card key={periodData.period} hover>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Period {periodData.period}</CardTitle>
                      <CardDescription>
                        {periodData.claimed ? "Claimed" : "Available to claim"}
                      </CardDescription>
                    </div>
                    {!periodData.claimed && periodData.claimable > BigInt(0) && (
                      <Button
                        variant="primary"
                        onClick={() => handleClaim(periodData.period)}
                      >
                        Claim Yield
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Distributable</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(periodData.distributable)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rental Yield</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(periodData.rentalYield)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">DeFi Yield</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(periodData.defiYield)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Your Claimable</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(periodData.claimable)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
