import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";
import { Link } from "react-router-dom";

export default function StackingPage() {
  const { isConnected, connect } = useStacks();
  const mounted = useMounted();

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
    <main className="flex-1 bg-gray-50 relative pattern-waves">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#06B6D4]/15 to-primary/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/10 to-[#06B6D4]/10 rounded-full blur-3xl"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Yield Stacking</h1>
          <p className="text-gray-600 font-light text-lg">DeFi yield stacking (removed in Stacks migration)</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>Yield stacking has been removed in the Stacks migration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The yield stacking feature has been removed as part of the migration to Stacks.
                The simplified architecture focuses on direct rent collection and yield distribution using USDCx.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>What changed:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                <li>Yield stacking with ERC-4626 vaults has been removed</li>
                <li>Rent is collected directly in USDCx</li>
                <li>Yield is distributed directly to shareholders</li>
                <li>Simplified cash flow management</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <Link to="/yield" className="flex-1">
                <Button variant="primary" className="w-full">
                  View Yield Distribution
                </Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

