import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Default Server Action body limit is 1MB; a phone photo of a nota fiscal (addPurchase's
  // photo param) typically runs 2-5MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
