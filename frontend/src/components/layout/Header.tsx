import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/utils";
import { useStacks } from "@/hooks/useStacks";

export const Header: React.FC = React.memo(() => {
  const { address, isConnected, connect, disconnect } = useStacks();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/property", label: "Property" },
    { href: "/rent", label: "Rent" },
    { href: "/expenses", label: "Expenses" },
    { href: "/yield", label: "Yield" },
    { href: "/stacking", label: "Stacking" },
    { href: "/analytics", label: "Analytics" },
    { href: "/dao", label: "DAO" },
  ];

  return (
    <header className="bg-white elevation-2 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center elevation-2 group-hover:elevation-3 transition-material relative overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Ricardian Yield Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-xl"
                />
              </div>
              <span className="text-xl font-medium text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground bg-clip-text group-hover:from-primary group-hover:to-[#06B6D4] transition-all">
                Ricardian Yield
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-material"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {mounted && isConnected && address ? (
              <>
                <div className="hidden sm:block px-4 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 font-mono">
                    {formatAddress(address)}
                  </span>
                </div>
                <Button variant="text" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => connect()}
                disabled={!mounted}
              >
                Connect Wallet
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-material"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-material"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

