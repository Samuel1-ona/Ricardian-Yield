import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { Toaster } from "react-hot-toast";
import { MANTLE_SEPOLIA } from "@/lib/contracts";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

let wagmiConfig: ReturnType<typeof createConfig> | undefined = undefined;

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = createConfig({
      chains: [MANTLE_SEPOLIA],
      connectors: [
        injected(),
      ],
      transports: {
        [MANTLE_SEPOLIA.id]: http(MANTLE_SEPOLIA.rpcUrls.default.http[0], {
          timeout: 10000,
        }),
      },
    });
  }
  return wagmiConfig;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => getQueryClient(), []);
  const config = useMemo(() => getWagmiConfig(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: "#111827",
              border: "1px solid #10B981",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
