/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_NAME?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_EXPLORER_URL?: string;
  readonly VITE_PROPERTY_CASH_FLOW_SYSTEM_ADDRESS?: string;
  readonly VITE_PROPERTY_NFT_ADDRESS?: string;
  readonly VITE_PROPERTY_SHARES_ADDRESS?: string;
  readonly VITE_RENT_VAULT_ADDRESS?: string;
  readonly VITE_CASH_FLOW_ENGINE_ADDRESS?: string;
  readonly VITE_YIELD_DISTRIBUTOR_ADDRESS?: string;
  readonly VITE_DAO_ADDRESS?: string;
  readonly VITE_YIELD_STACKING_MANAGER_ADDRESS?: string;
  readonly VITE_MOCK_ERC4626_VAULT_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
  readonly VITE_IMPLEMENTATION_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

