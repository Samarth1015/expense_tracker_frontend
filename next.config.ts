import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Remove the invalid 'css' key from experimental
  experimental: {
    // Add valid experimental options here if needed
    // serverComponentsExternalPackages: ['some-package'],
  },

  // Ensure standalone output is properly configured
  distDir: ".next",

  // Add proper CSS configuration if needed
  // compiler: {
  //   // Add compiler options here
  // },

  // Other configuration options
  reactStrictMode: true,

};

export default nextConfig;
