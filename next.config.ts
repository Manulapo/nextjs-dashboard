import { NextConfig } from "next/dist/types";

const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental'
  },
  images: {
    domains: ['randomuser.me'], 
  },
};

export default nextConfig;