import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";

type ProposalStatus = "pending" | "approved" | "executed";

interface Proposal {
  id: number;
  amount: bigint;
  description: string;
  status: ProposalStatus;
  proposer: string;
  createdAt: string;
}

export default function CapExPage() {
  const { isConnected, address } = useAccount();
  const mounted = useMounted();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Mock data
  const proposals: Proposal[] = [
    {
      id: 1,
      amount: BigInt(20000) * BigInt(10) ** BigInt(18),
      description: "Property renovation - kitchen and bathroom",
      status: "executed",
      proposer: "0x1234...5678",
      createdAt: "2024-01-10",
    },
    {
      id: 2,
      amount: BigInt(15000) * BigInt(10) ** BigInt(18),
      description: "Roof replacement",
      status: "approved",
      proposer: "0x1234...5678",
      createdAt: "2024-01-15",
    },
    {
      id: 3,
      amount: BigInt(10000) * BigInt(10) ** BigInt(18),
      description: "HVAC system upgrade",
      status: "pending",
      proposer: "0x1234...5678",
      createdAt: "2024-01-20",
    },
  ];

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-primary-light text-primary-dark";
      case "executed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      setIsCreating(true);
      // TODO: Implement actual contract interaction
      toast.success("CapEx proposal created successfully!");
      setAmount("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to create proposal");
      console.error(error);
    } finally {
      setIsCreating(false);
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
              Create Proposal
            </Button>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <Card>
          <CardHeader>
            <CardTitle>CapEx Proposals</CardTitle>
            <CardDescription>All capital expenditure proposals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">Proposal #{proposal.id}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}
                        >
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{proposal.description}</p>
                      <p className="text-sm text-gray-500">
                        Proposed by {proposal.proposer} on {proposal.createdAt}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(proposal.amount)}
                      </p>
                    </div>
                  </div>
                  {proposal.status === "pending" && address && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="primary" size="sm">
                        Approve
                      </Button>
                      <Button variant="outline" size="sm">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

