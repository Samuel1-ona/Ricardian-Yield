// Contract ABIs and addresses configuration
import deployedContracts from './deployed-contracts.json';

// Import ABIs from JSON files
import PropertyCashFlowSystemCoreABI from './abis/PropertyCashFlowSystemCore.json';
import PropertyNFTABI from './abis/PropertyNFT.json';
import PropertySharesABI from './abis/PropertyShares.json';
import RentVaultABI from './abis/RentVault.json';
import CashFlowEngineABI from './abis/CashFlowEngine.json';
import YieldDistributorABI from './abis/YieldDistributor.json';
import SimpleDAOABI from './abis/SimpleDAO.json';
import YieldStackingManagerABI from './abis/YieldStackingManager.json';

// Helper function to get address from env or fallback to JSON
function getAddress(envKey: string, fallback: string): `0x${string}` {
  const envValue = import.meta.env[envKey];
  if (envValue && typeof envValue === 'string' && envValue.startsWith('0x')) {
    return envValue as `0x${string}`;
  }
  return fallback as `0x${string}`;
}

// Network configuration from env or defaults
export const MANTLE_SEPOLIA = {
  id: Number(import.meta.env.VITE_CHAIN_ID) || 5003,
  name: import.meta.env.VITE_NETWORK_NAME || "Mantle Sepolia Testnet",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.mantle.xyz"],
    },
    public: {
      http: [import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: import.meta.env.VITE_EXPLORER_URL || "https://explorer.sepolia.mantle.xyz",
    },
  },
};

// Contract addresses from environment variables or fallback to JSON
export const CONTRACT_ADDRESSES = {
  // Main system (use this for all interactions)
  PROPERTY_CASH_FLOW_SYSTEM: getAddress(
    'VITE_PROPERTY_CASH_FLOW_SYSTEM_ADDRESS',
    deployedContracts.contracts.proxy.address
  ),
  
  // Sub-contracts
  PROPERTY_NFT: getAddress(
    'VITE_PROPERTY_NFT_ADDRESS',
    deployedContracts.contracts.propertyNFT.address
  ),
  PROPERTY_SHARES: getAddress(
    'VITE_PROPERTY_SHARES_ADDRESS',
    deployedContracts.contracts.propertyShares.address
  ),
  RENT_VAULT: getAddress(
    'VITE_RENT_VAULT_ADDRESS',
    deployedContracts.contracts.rentVault.address
  ),
  CASH_FLOW_ENGINE: getAddress(
    'VITE_CASH_FLOW_ENGINE_ADDRESS',
    deployedContracts.contracts.cashFlowEngine.address
  ),
  YIELD_DISTRIBUTOR: getAddress(
    'VITE_YIELD_DISTRIBUTOR_ADDRESS',
    deployedContracts.contracts.yieldDistributor.address
  ),
  DAO: getAddress(
    'VITE_DAO_ADDRESS',
    deployedContracts.contracts.dao.address
  ),
  YIELD_STACKING_MANAGER: getAddress(
    'VITE_YIELD_STACKING_MANAGER_ADDRESS',
    deployedContracts.contracts.yieldStackingManager.address
  ),
  // Note: Mock ERC-4626 vault not needed for native MNT (yield stacking disabled)
  MOCK_ERC4626_VAULT: getAddress(
    'VITE_MOCK_ERC4626_VAULT_ADDRESS',
    '0x0000000000000000000000000000000000000000' // Not used with native MNT
  ),
  
  // Note: USDC not needed - using native MNT
  // Kept for backward compatibility, but not used
  USDC: getAddress(
    'VITE_USDC_ADDRESS',
    '0x0000000000000000000000000000000000000000' // Not used with native MNT
  ),
} as const;

// Contract ABIs
export const CONTRACT_ABIS = {
  PROPERTY_CASH_FLOW_SYSTEM: PropertyCashFlowSystemCoreABI.abi,
  PROPERTY_NFT: PropertyNFTABI.abi,
  PROPERTY_SHARES: PropertySharesABI.abi,
  RENT_VAULT: RentVaultABI.abi,
  CASH_FLOW_ENGINE: CashFlowEngineABI.abi,
  YIELD_DISTRIBUTOR: YieldDistributorABI.abi,
  DAO: SimpleDAOABI.abi,
  YIELD_STACKING_MANAGER: YieldStackingManagerABI.abi,
} as const;

// Type definitions
export interface PropertyData {
  location: string;
  valuation: bigint;
  monthlyRent: bigint;
  metadataURI: string;
}

export interface CapExProposal {
  id: bigint;
  description: string;
  amount: bigint;
  proposer: `0x${string}`;
  votesFor: bigint;
  votesAgainst: bigint;
  executed: boolean;
  deadline: bigint;
}

// Helper function to get contract address
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES): `0x${string}` {
  return CONTRACT_ADDRESSES[contractName];
}

// Helper function to get contract ABI
export function getContractABI(contractName: keyof typeof CONTRACT_ABIS) {
  return CONTRACT_ABIS[contractName];
}
