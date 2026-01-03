"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mantleTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { Toaster } from "react-hot-toast";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
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

const config = createConfig({
  chains: [mantleTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [mantleTestnet.id]: http("https://rpc.testnet.mantle.xyz"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

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

