import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow images from external sources if needed
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
