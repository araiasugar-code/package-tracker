import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'production' 
      ? 'https://package-tracker-akihiro-arais-projects.vercel.app'
      : 'http://localhost:3000'
  }
};

export default nextConfig;
