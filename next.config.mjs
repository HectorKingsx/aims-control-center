/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/aims-control-center",
  assetPrefix: "/aims-control-center/",
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  experimental: {
    webpackBuildWorker: false,
  },
};
export default nextConfig;
