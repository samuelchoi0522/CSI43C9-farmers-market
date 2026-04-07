import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Next.js to generate flat HTML/CSS/JS files
  output: 'export',
  
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
