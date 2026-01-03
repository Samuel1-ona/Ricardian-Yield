// Contract ABIs and addresses will be imported here
// For now, we'll set up the structure

export const MANTLE_TESTNET = {
  id: 5001,
  name: "Mantle Testnet",
  network: "mantle-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.testnet.mantle.xyz",
    },
  },
};

// Contract addresses will be set after deployment
export const CONTRACT_ADDRESSES = {
  PROPERTY_CASH_FLOW_SYSTEM: process.env.NEXT_PUBLIC_SYSTEM_ADDRESS || "",
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
};

// ABIs will be imported from the compiled contracts
// For now, we'll create placeholder types

export interface PropertyData {
  location: string;
  valuation: bigint;
  monthlyRent: bigint;
  metadataURI: string;
}

