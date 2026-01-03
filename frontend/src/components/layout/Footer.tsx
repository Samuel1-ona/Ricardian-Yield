import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = React.memo(() => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="flex items-center space-x-3 mb-4 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Ricardian Yield Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-xl"
                />
              </div>
              <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-material">
                Ricardian Yield
              </h3>
            </Link>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              Where classical economics meets yield stacking. Tokenize rental real estate and maximize returns.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider text-xs">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link to="/docs" className="hover:text-primary transition-material font-light">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-material font-light">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider text-xs">Network</h4>
            <p className="text-sm text-gray-600 font-light">Built on Mantle Network</p>
            <p className="text-xs text-gray-500 mt-2 font-light">Powered by ERC-4626 yield stacking</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500 font-light">
          <p>© 2024 Ricardian Yield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

