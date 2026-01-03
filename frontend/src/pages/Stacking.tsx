import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatAddress } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";
import toast from "react-hot-toast";
import {
  useYieldEarned,
  useTotalAssetsInVault,
  useTotalDeposited,
  useYieldVaultAddress,
  useReserveThreshold,
  useMinimumDepositAmount,
  useAutoDepositEnabled,
} from "@/hooks/useYield";
import {
  useSetReserveThreshold,
  useSetMinimumDepositAmount,
  useSetAutoDepositEnabled,
} from "@/hooks/useContractWrite";
import { formatUnits } from "viem";

export default function StackingPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [reserveThresholdInput, setReserveThresholdInput] = useState("");
  const [minimumDepositInput, setMinimumDepositInput] = useState("");
  const [autoDepositToggle, setAutoDepositToggle] = useState(false);

  // Contract hooks - read
  const { totalAssets } = useTotalAssetsInVault();
  const { yieldEarned } = useYieldEarned();
  const { totalDeposited } = useTotalDeposited();
  const { vaultAddress } = useYieldVaultAddress();
  const { reserveThreshold } = useReserveThreshold();
  const { minimumDeposit } = useMinimumDepositAmount();
  const { autoDepositEnabled } = useAutoDepositEnabled();

  // Contract hooks - write
  const { setReserveThreshold, isPending: isSettingReserve, isConfirmed: reserveSet } = useSetReserveThreshold();
  const { setMinimumDeposit, isPending: isSettingMinimum, isConfirmed: minimumSet } = useSetMinimumDepositAmount();
  const { setAutoDeposit, isPending: isSettingAuto, isConfirmed: autoSet } = useSetAutoDepositEnabled();

  // Initialize form values when data loads
  useEffect(() => {
    if (reserveThreshold && !reserveThresholdInput) {
      setReserveThresholdInput(formatUnits(reserveThreshold as bigint, 6));
    }
  }, [reserveThreshold, reserveThresholdInput]);

  useEffect(() => {
    if (minimumDeposit && !minimumDepositInput) {
      setMinimumDepositInput(formatUnits(minimumDeposit as bigint, 6));
    }
  }, [minimumDeposit, minimumDepositInput]);

  useEffect(() => {
    if (autoDepositEnabled !== undefined) {
      setAutoDepositToggle(autoDepositEnabled ?? false);
    }
  }, [autoDepositEnabled]);

  // Handle successful updates
  useEffect(() => {
    if (reserveSet || minimumSet || autoSet) {
      toast.success("Configuration updated successfully!");
      setIsConfiguring(false);
    }
  }, [reserveSet, minimumSet, autoSet]);

  const handleSaveConfiguration = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      if (reserveThresholdInput && parseFloat(reserveThresholdInput) > 0) {
        await setReserveThreshold(reserveThresholdInput);
      }
      if (minimumDepositInput && parseFloat(minimumDepositInput) > 0) {
        await setMinimumDeposit(minimumDepositInput);
      }
      await setAutoDeposit(autoDepositToggle);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update configuration");
      console.error(error);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Please connect your wallet to view yield stacking</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
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
                {totalAssets ? formatCurrency(totalAssets as bigint) : "0 USDC"}
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
                {yieldEarned ? formatCurrency(yieldEarned as bigint) : "0 USDC"}
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
                {totalDeposited ? formatCurrency(totalDeposited as bigint) : "0 USDC"}
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
                <span className="font-mono text-sm text-foreground">
                  {vaultAddress ? formatAddress(vaultAddress as `0x${string}`) : "Not set"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reserve Threshold</span>
                <span className="font-semibold text-foreground">
                  {reserveThreshold ? formatCurrency(reserveThreshold as bigint) : "0 USDC"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Minimum Deposit</span>
                <span className="font-semibold text-foreground">
                  {minimumDeposit ? formatCurrency(minimumDeposit as bigint) : "0 USDC"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Auto-Deposit</span>
                <span className={`font-semibold ${autoDepositEnabled ? "text-primary" : "text-gray-500"}`}>
                  {autoDepositEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {!isConfiguring ? (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsConfiguring(true)}
                >
                  Configure Settings
                </Button>
              ) : (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reserve Threshold (USDC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={reserveThresholdInput}
                      onChange={(e) => setReserveThresholdInput(e.target.value)}
                      placeholder="2000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Deposit (USDC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={minimumDepositInput}
                      onChange={(e) => setMinimumDepositInput(e.target.value)}
                      placeholder="1000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Auto-Deposit Enabled</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDepositToggle}
                        onChange={(e) => setAutoDepositToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleSaveConfiguration}
                      isLoading={isSettingReserve || isSettingMinimum || isSettingAuto}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsConfiguring(false);
                        setReserveThresholdInput(reserveThreshold ? formatUnits(reserveThreshold as bigint, 6) : "");
                        setMinimumDepositInput(minimumDeposit ? formatUnits(minimumDeposit as bigint, 6) : "");
                        setAutoDepositToggle(autoDepositEnabled ?? false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
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
  );
}

