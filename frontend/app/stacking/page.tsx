"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

// Force dynamic rendering - this page depends on wallet state
export const dynamic = 'force-dynamic';

export default function StackingPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Mock data
  const stackingData = {
    totalAssetsInVault: BigInt(15000) * BigInt(10) ** BigInt(18),
    yieldEarned: BigInt(2500) * BigInt(10) ** BigInt(18),
    principalDeposited: BigInt(12500) * BigInt(10) ** BigInt(18),
    reserveThreshold: BigInt(2000) * BigInt(10) ** BigInt(18),
    minimumDeposit: BigInt(1000) * BigInt(10) ** BigInt(18),
    autoDepositEnabled: true,
    vaultAddress: "0x1234...5678",
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
                <CardDescription>Please connect your wallet to view yield stacking</CardDescription>
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
      <main className="flex-1 bg-gray-50 relative pattern-waves">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#06B6D4]/15 to-primary/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/10 to-[#06B6D4]/10 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Yield Stacking</h1>
            <p className="text-gray-600 font-light text-lg">Monitor and configure automatic DeFi yield stacking</p>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 via-white to-[#06B6D4]/10 border-0 elevation-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/20 to-[#06B6D4]/20 rounded-full blur-xl"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg">Total Assets in Vault</CardTitle>
                <CardDescription>Principal + Yield</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-3xl font-light text-primary tracking-tight">
                  {formatCurrency(stackingData.totalAssetsInVault)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yield Earned</CardTitle>
                <CardDescription>From DeFi vault</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(stackingData.yieldEarned)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Principal Deposited</CardTitle>
                <CardDescription>Initial deposit amount</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stackingData.principalDeposited)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Configuration</CardTitle>
                <CardDescription>Yield stacking settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vault Address</span>
                  <span className="font-mono text-sm text-foreground">{stackingData.vaultAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reserve Threshold</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(stackingData.reserveThreshold)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Minimum Deposit</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(stackingData.minimumDeposit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Auto-Deposit</span>
                  <span className={`font-semibold ${stackingData.autoDepositEnabled ? "text-primary" : "text-gray-500"}`}>
                    {stackingData.autoDepositEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsConfiguring(true)}
                >
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Automatic yield stacking explained</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <p>
                      When rent is collected, idle funds above the reserve threshold are automatically
                      deposited into the ERC-4626 vault.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <p>
                      The vault earns DeFi yield on your idle funds, tracked separately from rental income.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <p>
                      Both rental yield and DeFi yield are included in distributions to shareholders.
                    </p>
                  </div>
                  <div className="bg-primary-light rounded-lg p-4 mt-4">
                    <p className="text-sm text-primary-dark">
                      <strong>Conservative Reserves:</strong> A configurable reserve threshold ensures
                      sufficient liquidity for expenses while maximizing yield on idle funds.
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
