import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Site 100% estático (login e banco rodam no navegador): exporta para out/,
  // publicado no Firebase Hosting no plano gratuito.
  output: "export",
};

export default nextConfig;
