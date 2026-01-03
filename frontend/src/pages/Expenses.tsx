import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";
import { useRecordOperatingExpense } from "@/hooks/useContractWrite";
import { 
  useOperatingExpenses, 
  useWorkingCapitalReserve,
  useCurrentPeriod 
} from "@/hooks/useCashFlow";

export default function ExpensesPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Contract hooks
  const { recordExpense, isPending: isRecording, isConfirming, isConfirmed } = useRecordOperatingExpense();
  const { operatingExpenses } = useOperatingExpenses();
  const { workingCapitalReserve } = useWorkingCapitalReserve();
  const { currentPeriod } = useCurrentPeriod();

  // Handle successful expense recording
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Expense recorded successfully!");
      setAmount("");
      setDescription("");
    }
  }, [isConfirmed]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await recordExpense(amount);
    } catch (error: any) {
      toast.error(error?.message || "Failed to record expense");
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
              <CardDescription>Please connect your wallet to record expenses</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Expense Management</h1>
          <p className="text-gray-600 font-light text-lg">Record and track operating expenses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Expenses</CardTitle>
              <CardDescription>
                {currentPeriod !== undefined && currentPeriod !== null ? `Period ${currentPeriod.toString()}` : "Current period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">
                {operatingExpenses ? formatCurrency(operatingExpenses as bigint) : "0 USDC"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Working Capital Reserve</CardTitle>
              <CardDescription>Safety buffer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {workingCapitalReserve ? formatCurrency(workingCapitalReserve as bigint) : "0 USDC"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Period</CardTitle>
              <CardDescription>Active period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {currentPeriod !== undefined && currentPeriod !== null ? currentPeriod.toString() : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Record Expense Form */}
          <Card>
            <CardHeader>
              <CardTitle>Record New Expense</CardTitle>
              <CardDescription>Add an operating expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Property maintenance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSubmit}
                isLoading={isRecording || isConfirming}
              >
                {isRecording || isConfirming ? "Recording..." : "Record Expense"}
              </Button>
            </CardContent>
          </Card>

          {/* Expense History */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>
                {currentPeriod !== undefined 
                  ? `Total expenses for period ${currentPeriod !== null ? currentPeriod.toString() : ""}` 
                  : "Current period expenses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operatingExpenses !== undefined && (operatingExpenses as bigint) > BigInt(0) ? (
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-foreground">Total Operating Expenses</p>
                        <p className="text-sm text-gray-500">
                          {currentPeriod !== undefined 
                            ? `Period ${currentPeriod !== null ? currentPeriod.toString() : ""}` 
                            : "Current period"}
                        </p>
                      </div>
                      <p className="font-semibold text-red-500">
                        {formatCurrency(operatingExpenses as bigint)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No expenses recorded for this period yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

