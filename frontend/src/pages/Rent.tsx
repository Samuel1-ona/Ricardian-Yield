import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useStacks } from "@/hooks/useStacks";
import { useUSDCxBalance } from "@/hooks/useUSDCx";
import { useDepositRentWallet } from "@/hooks/useStacksWriteWallet";
import { useRentCollected, useCurrentPeriod } from "@/hooks/useStacksRead";
import { BridgeUSDC } from "@/components/BridgeUSDC";

export default function RentPage() {
  const { isConnected, connect } = useStacks();
  const [amount, setAmount] = useState("");
  const [propertyId] = useState(BigInt(1)); // TODO: Get from context or props
  
  // Contract hooks
  const { depositRent, isPending: isDepositing } = useDepositRentWallet();
  const { balance: usdcxBalance, formatted: formattedBalance, isLoading: isLoadingBalance } = useUSDCxBalance();
  const { rentCollected } = useRentCollected(propertyId);
  const { currentPeriod } = useCurrentPeriod(propertyId);
  
  // Handle successful deposit
  useEffect(() => {
    // Note: In a real app, you'd listen for transaction confirmations
    // For now, we rely on the hook's internal toast notifications
  }, []);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    // Check USDCx balance (6 decimals)
    const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));
    const balance = usdcxBalance || BigInt(0);
    
    if (balance < amountMicro) {
      toast.error(
        `Insufficient USDCx balance. You have ${formattedBalance} USDCx but need ${amount} USDCx`
      );
      return;
    }

    try {
      await depositRent(propertyId, amount);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      // Error is already handled by the hook
    }
  };

  // Check if user has sufficient balance
  const amountMicro = amount && parseFloat(amount) > 0 
    ? BigInt(Math.floor(parseFloat(amount) * 1e6)) 
    : BigInt(0);
  const balance = usdcxBalance || BigInt(0);
  const hasInsufficientBalance = balance < amountMicro;
  const hasNoBalance = balance === BigInt(0);

  if (!isConnected) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Please connect your Stacks wallet to deposit rent</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connect} variant="primary" className="w-full">
              Connect Stacks Wallet
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-dots">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Deposit Rent</h1>
          <p className="text-gray-600 font-light text-lg">Record a new rent payment with USDCx</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deposit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* USDCx Balance & Bridge */}
            <Card>
              <CardHeader>
                <CardTitle>Your USDCx Balance</CardTitle>
                <CardDescription>USDCx on Stacks testnet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-primary/10 to-[#06B6D4]/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Balance:</span>
                    <span className="text-lg font-semibold text-primary">
                      {isLoadingBalance ? "Loading..." : `${formattedBalance} USDCx`}
                    </span>
                  </div>
                  {hasNoBalance && !isLoadingBalance && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>No USDCx in wallet.</strong> You need USDCx tokens to deposit rent.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bridge Component */}
            {hasNoBalance && !isLoadingBalance && (
              <BridgeUSDC />
            )}

            {/* Deposit Form */}
            <Card>
              <CardHeader>
                <CardTitle>New Rent Payment</CardTitle>
                <CardDescription>Enter the rent amount in USDCx</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDCx)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                      hasInsufficientBalance ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {hasInsufficientBalance && (
                    <p className="mt-1 text-sm text-red-600">
                      Insufficient balance. You need {amount} USDCx but only have {formattedBalance} USDCx.
                    </p>
                  )}
                </div>

                <div className="bg-primary-light rounded-lg p-4">
                  <p className="text-sm text-primary-dark">
                    <strong>Note:</strong> This will transfer USDCx to the rent vault and record the deposit.
                    Make sure you have enough USDCx for the deposit.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleDeposit}
                    isLoading={isDepositing}
                    disabled={hasInsufficientBalance || hasNoBalance || !amount || parseFloat(amount) <= 0}
                  >
                    Deposit Rent
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
                <CardDescription>
                  {currentPeriod !== undefined 
                    ? `Current Period: ${currentPeriod?.toString() || "0"}` 
                    : "Loading..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPeriod !== undefined && (
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">Current Period</p>
                          <p className="text-sm text-gray-500">Period {currentPeriod?.toString() || "0"}</p>
                        </div>
                        <p className="font-semibold text-primary">
                          {rentCollected ? `${(Number(rentCollected) / 1e6).toFixed(6)} USDCx` : "0 USDCx"}
                        </p>
                      </div>
                    </div>
                  )}
                  {currentPeriod === undefined && (
                    <p className="text-gray-500 text-sm">No rent history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
