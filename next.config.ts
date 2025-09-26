import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/ai-services",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
