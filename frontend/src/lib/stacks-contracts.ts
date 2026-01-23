// Stacks Clarity contracts configuration
import contractAddresses from '../../../contracts/ricardian/contract-address.json';

// Network configuration
export const STACKS_NETWORK = {
  testnet: {
    url: 'https://api.testnet.hiro.so',
    chainId: 2147483648,
  },
  mainnet: {
    url: 'https://api.hiro.so',
    chainId: 1,
  },
};

// Contract addresses from deployment
export const STACKS_CONTRACTS = {
  'property-nft': contractAddresses['property-nft'],
  'rent-vault': contractAddresses['rent-vault'],
  'property-shares': contractAddresses['property-shares'],
  'simple-dao': contractAddresses['simple-dao'],
  'cash-flow-engine': contractAddresses['cash-flow-engine'],
  'yield-distributor': contractAddresses['yield-distributor'],
} as const;

// USDCx contract addresses
export const USDCX_CONTRACTS = {
  testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
  mainnet: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
} as const;

// Ethereum xReserve contract addresses (for bridging)
export const XRESERVE_CONTRACTS = {
  testnet: '0x008888878f94C0d87defdf0B07f46B93C1934442', // Sepolia
  mainnet: '0x0000000000000000000000000000000000000000', // TODO: Add mainnet address
} as const;

// Ethereum USDC contract addresses
export const ETH_USDC_CONTRACTS = {
  testnet: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet
} as const;

// Domain IDs for bridging
export const DOMAIN_IDS = {
  ETHEREUM: 0,
  STACKS: 10003,
} as const;

// Helper to get contract address
export function getContractAddress(contractName: keyof typeof STACKS_CONTRACTS): string {
  return STACKS_CONTRACTS[contractName];
}

// Helper to get USDCx address (defaults to testnet)
export function getUSDCxAddress(network: 'testnet' | 'mainnet' = 'testnet'): string {
  return USDCX_CONTRACTS[network];
}

// Helper to parse contract address (format: "ST...contract-name")
export function parseContractAddress(fullAddress: string): { address: string; contractName: string } {
  const parts = fullAddress.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid contract address format: ${fullAddress}`);
  }
  return {
    address: parts[0],
    contractName: parts[1],
  };
}

