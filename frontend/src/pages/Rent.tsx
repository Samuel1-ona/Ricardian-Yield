import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useDepositRent } from "@/hooks/useContractWrite";
import { useRentCollected, useCurrentPeriod } from "@/hooks/useCashFlow";
import { parseUnits } from "viem";

export default function RentPage() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState("");
  
  // Contract hooks
  const { depositRent, isPending: isDepositing, isConfirmed } = useDepositRent();
  const { data: balanceData } = useBalance({ address }); // Native MNT balance
  const { rentCollected } = useRentCollected();
  const { currentPeriod } = useCurrentPeriod();
  
  const mntBalance = balanceData?.value;

  // Handle successful deposit
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Rent deposited successfully!");
      setAmount("");
    }
  }, [isConfirmed]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    // Check MNT balance (need extra for gas)
    const amountWei = parseUnits(amount, 18); // MNT has 18 decimals
    const balance = mntBalance;
    
    if (!balance || balance < amountWei) {
      toast.error(`Insufficient MNT balance. You have ${balance ? formatCurrency(balance) : "0 MNT"} but need ${formatCurrency(amountWei)}`);
      return;
    }

    try {
      // Deposit with native MNT (no approval needed)
      await depositRent(amount);
    } catch (error: any) {
      toast.error(error?.message || "Failed to deposit rent");
      console.error(error);
    }
  };

  // Check if user has sufficient balance (accounting for gas)
  const amountWei = amount && parseFloat(amount) > 0 ? parseUnits(amount, 18) : BigInt(0);
  const balance = mntBalance;
  // Reserve some MNT for gas (estimate 0.01 MNT)
  const gasReserve = parseUnits("0.01", 18);
  const hasInsufficientBalance = balance !== undefined && (amountWei + gasReserve) > balance;
  const hasNoBalance = balance === undefined || balance === BigInt(0);

  if (!isConnected) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Please connect your wallet to deposit rent</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
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
                <CardDescription>Enter the rent amount in MNT (native Mantle token)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* MNT Balance Display */}
                <div className="bg-gradient-to-r from-primary/10 to-[#06B6D4]/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Your MNT Balance:</span>
                    <span className="text-lg font-semibold text-primary">
                      {mntBalance !== undefined ? formatCurrency(mntBalance) : "Loading..."}
                    </span>
                  </div>
                  {hasNoBalance && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>No MNT in wallet.</strong> You need MNT tokens to deposit rent.
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>Get testnet MNT:</strong></p>
                        <p>Visit <a href="https://faucet.testnet.mantle.xyz/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mantle Faucet</a> to get free testnet MNT</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (MNT)
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
                      Insufficient balance. You need {formatCurrency(amountWei)} but only have {formatCurrency(balance as bigint)}.
                    </p>
                  )}
                </div>

                <div className="bg-primary-light rounded-lg p-4">
                  <p className="text-sm text-primary-dark">
                    <strong>Note:</strong> Depositing with native MNT - no approval needed!
                    Make sure you have enough MNT for both the deposit and gas fees.
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
                    ? `Current Period: ${currentPeriod !== null ? currentPeriod.toString() : ""}` 
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
                          <p className="text-sm text-gray-500">Period {currentPeriod !== null ? currentPeriod.toString() : ""}</p>
                        </div>
                        <p className="font-semibold text-primary">
                          {rentCollected ? formatCurrency(rentCollected as bigint) : "0 MNT"}
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

