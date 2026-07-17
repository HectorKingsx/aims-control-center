/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  experimental: {
    webpackBuildWorker: false,
  },
};
export default nextConfig;
