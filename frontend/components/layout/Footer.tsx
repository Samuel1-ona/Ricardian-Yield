import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Ricardian Yield</h3>
            <p className="text-sm text-gray-500">
              Where classical economics meets yield stacking. Tokenize rental real estate and maximize returns.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/docs" className="hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Network</h4>
            <p className="text-sm text-gray-500">Built on Mantle Network</p>
            <p className="text-xs text-gray-400 mt-2">Powered by ERC-4626 yield stacking</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>© 2024 Ricardian Yield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

