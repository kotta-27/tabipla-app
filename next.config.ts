import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["10.20.1.*"],
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
