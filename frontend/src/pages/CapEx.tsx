import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";
import { useCreateCapExProposalWallet } from "@/hooks/useStacksWriteWallet";
import { useProposalCount, useProposal, useIsProposalApproved } from "@/hooks/useStacksRead";

export default function CapExPage() {
  const { isConnected, connect } = useStacks();
  const mounted = useMounted();
  const [propertyId] = useState(BigInt(1)); // TODO: Get from context or props
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Contract hooks
  const { createProposal, isPending: isCreating } = useCreateCapExProposalWallet();
  const { proposalCount } = useProposalCount();

  // Fetch all proposals
  const proposalIds = useMemo(() => {
    if (!proposalCount) return [];
    const count = Number(proposalCount);
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [proposalCount]);


  const handleCreateProposal = async () => {
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
      await createProposal(propertyId, amount, description);
      setAmount("");
      setDescription("");
    } catch (error: any) {
      console.error(error);
      // Error is already handled by the hook
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
              <CardDescription>Please connect your wallet to manage CapEx proposals</CardDescription>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">CapEx Governance</h1>
          <p className="text-gray-600 font-light text-lg">Create and manage capital expenditure proposals</p>
        </div>

        {/* Create Proposal */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New CapEx Proposal</CardTitle>
            <CardDescription>
              Propose a capital expenditure for property improvement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the capital expenditure (e.g., Property renovation, HVAC upgrade)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="bg-primary-light rounded-lg p-4">
              <p className="text-sm text-primary-dark">
                <strong>Note:</strong> CapEx affects property value but is excluded from immediate
                yield distribution, showing long-term value creation.
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCreateProposal}
              isLoading={isCreating}
            >
              {isCreating ? "Creating..." : "Create Proposal"}
            </Button>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <Card>
          <CardHeader>
            <CardTitle>CapEx Proposals</CardTitle>
            <CardDescription>
              {proposalCount !== undefined && proposalCount !== null
                ? `${proposalCount.toString()} proposal(s) total` 
                : "All capital expenditure proposals"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposalIds.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No proposals created yet. Create one above to get started.
                </p>
              ) : (
                proposalIds.map((proposalId) => (
                  <ProposalItem key={proposalId.toString()} proposalId={proposalId} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Component to display a single proposal
function ProposalItem({ proposalId }: { proposalId: bigint }) {
  const [propertyId] = useState(BigInt(1)); // TODO: Get from context
  const { proposal, isLoading } = useProposal(propertyId, proposalId);
  const { isApproved } = useIsProposalApproved(propertyId, proposalId);

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const getStatusColor = (approved: boolean | undefined) => {
    return approved 
      ? "bg-primary-light text-primary-dark"
      : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-foreground">Proposal #{proposalId.toString()}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isApproved)}`}
            >
              {isApproved ? "Approved" : "Pending"}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{proposal.description}</p>
          <p className="text-sm text-gray-500">
            Proposed by {formatAddress(proposal.proposer)} on{" "}
            {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-foreground">
            {proposal.amount ? `${(Number(proposal.amount) / 1e6).toFixed(6)} USDCx` : "0 USDCx"}
          </p>
        </div>
      </div>
    </div>
  );
}

