import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Permite subir fotos de motocicletas (hasta 5MB) vía Server Actions.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
