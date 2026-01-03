"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export const Header: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only showing wallet state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-foreground">Ricardian Yield</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/dashboard" className="text-gray-600 hover:text-primary transition-colors text-sm lg:text-base">
              Dashboard
            </Link>
            <Link href="/property" className="text-gray-600 hover:text-primary transition-colors text-sm lg:text-base">
              Property
            </Link>
            <Link href="/yield" className="text-gray-600 hover:text-primary transition-colors text-sm lg:text-base">
              Yield
            </Link>
            <Link href="/stacking" className="text-gray-600 hover:text-primary transition-colors text-sm lg:text-base">
              Stacking
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {mounted && isConnected && address ? (
              <>
                <div className="hidden sm:block px-3 py-1.5 bg-primary-light rounded-lg">
                  <span className="text-sm font-medium text-primary-dark">
                    {formatAddress(address)}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (connectors.length > 0) {
                    connect({ connector: connectors[0] });
                  }
                }}
                disabled={!mounted || connectors.length === 0}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

