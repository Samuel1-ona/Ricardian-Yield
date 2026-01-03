import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for faster development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Reduce bundle size and improve compilation speed
  experimental: {
    optimizePackageImports: ['recharts', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  
  // Disable dev indicators (compiling/rendering messages)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // Faster compilation settings
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable ESLint during builds for faster compilation
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during builds (run separately)
  typescript: {
    ignoreBuildErrors: false, // Keep this false for production, but speeds up dev
  },
  
  // Turbopack configuration (required when using --turbo flag)
  // Turbopack is faster than webpack and doesn't need custom config for most cases
  turbopack: {},
};

export default nextConfig;
