import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Standard ERC20 ABI for USDC
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// Get user's USDC balance
export function useUSDCBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data,
    isLoading,
    error,
  };
}

// Get USDC allowance for RentVault
export function useUSDCAllowance() {
  const { address } = useAccount();
  
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && CONTRACT_ADDRESSES.RENT_VAULT 
      ? [address, CONTRACT_ADDRESSES.RENT_VAULT] 
      : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    allowance: data,
    isLoading,
    error,
  };
}

// Get PropertyShares balance
export function usePropertySharesBalance() {
  const { address } = useAccount();
  
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_SHARES,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data,
    isLoading,
    error,
  };
}

// Get total supply of PropertyShares
export function usePropertySharesTotalSupply() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_SHARES,
    abi: [
      {
        name: "totalSupply",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "totalSupply",
  });

  return {
    totalSupply: data,
    isLoading,
    error,
  };
}

