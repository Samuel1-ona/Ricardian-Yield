import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for faster development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['recharts', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
};

export default nextConfig;
