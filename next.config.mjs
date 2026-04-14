/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();

const nextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
