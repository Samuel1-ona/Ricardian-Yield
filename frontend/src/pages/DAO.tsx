import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatAddress } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";
import { useCreateCapExProposal, useApproveProposal } from "@/hooks/useContractWrite";
import { useProposalCount, useProposal, useIsProposalApproved } from "@/hooks/useDAO";

export default function DAOPage() {
  const { isConnected } = useAccount();
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Contract hooks
  const { createProposal, isPending: isCreating, isConfirming: isCreatingConfirming, isConfirmed: isCreated } = useCreateCapExProposal();
  const { approveProposal, isPending: isApproving, isConfirming: isApprovingConfirming, isConfirmed: isApproved } = useApproveProposal();
  const { proposalCount } = useProposalCount();

  // Fetch all proposals
  const proposalIds = useMemo(() => {
    if (!proposalCount) return [];
    const count = Number(proposalCount);
    return Array.from({ length: count }, (_, i) => BigInt(i));
  }, [proposalCount]);

  // Handle successful proposal creation
  useEffect(() => {
    if (isCreated) {
      toast.success("Proposal created successfully!");
      setAmount("");
      setDescription("");
    }
  }, [isCreated]);

  // Handle successful proposal approval
  useEffect(() => {
    if (isApproved) {
      toast.success("Proposal approved!");
    }
  }, [isApproved]);

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
      await createProposal(amount, description);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create proposal");
      console.error(error);
    }
  };

  const handleApproveProposal = async (proposalId: bigint) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await approveProposal(proposalId);
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve proposal");
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
              <CardDescription>Please connect your wallet to participate in governance</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-waves">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#06B6D4]/5"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">DAO Governance</h1>
          <p className="text-gray-600 font-light text-lg">Create and vote on CapEx proposals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Proposals</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {proposalCount !== undefined && proposalCount !== null ? proposalCount.toString() : "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Proposals</CardTitle>
              <CardDescription>Awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {proposalIds.length > 0 ? "Check below" : "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved Proposals</CardTitle>
              <CardDescription>Approved</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {proposalIds.length > 0 ? "Check below" : "0"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Proposal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
              <CardDescription>Propose a new CapEx expenditure</CardDescription>
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
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Roof replacement and repair"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                />
              </div>
              <div className="bg-primary-light rounded-lg p-4">
                <p className="text-sm text-primary-dark">
                  <strong>Note:</strong> Proposals require approval from authorized signers before execution.
                  In production, this would use token-weighted voting.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreateProposal}
                isLoading={isCreating || isCreatingConfirming}
              >
                {isCreating || isCreatingConfirming ? "Creating..." : "Create Proposal"}
              </Button>
            </CardContent>
          </Card>

          {/* Proposals List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Proposals</CardTitle>
              <CardDescription>
                {proposalCount !== undefined && proposalCount !== null
                  ? `${proposalCount.toString()} proposal(s) total` 
                  : "Recent CapEx proposals"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {proposalIds.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No proposals created yet. Create one above to get started.
                  </p>
                ) : (
                  proposalIds.map((proposalId) => (
                    <ProposalItem 
                      key={proposalId.toString()} 
                      proposalId={proposalId}
                      onApprove={handleApproveProposal}
                      isApproving={isApproving || isApprovingConfirming}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

// Component to display a single proposal
function ProposalItem({ 
  proposalId, 
  onApprove,
  isApproving 
}: { 
  proposalId: bigint;
  onApprove: (id: bigint) => void;
  isApproving: boolean;
}) {
  const { proposal, isLoading } = useProposal(proposalId);
  const { isApproved } = useIsProposalApproved(proposalId);

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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-material">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-foreground">Proposal #{proposalId.toString()}</h3>
            {isApproved ? (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                Approved
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{proposal.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Proposer: {formatAddress(proposal.proposer)}</span>
            <span>
              {new Date(Number(proposal.timestamp) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-primary text-lg">
            {formatCurrency(proposal.amount)}
          </p>
        </div>
      </div>
      {!isApproved && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => onApprove(proposalId)}
          isLoading={isApproving}
        >
          {isApproving ? "Approving..." : "Approve Proposal"}
        </Button>
      )}
    </div>
  );
}

