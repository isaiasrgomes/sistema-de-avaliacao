/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim();

const nextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  async redirects() {
    const prefix = basePath.replace(/\/$/, "");
    return [
      {
        source: prefix ? `${prefix}/resultado` : "/resultado",
        destination: prefix || "/",
        permanent: false,
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
