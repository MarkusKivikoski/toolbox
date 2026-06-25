import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship a fully static site (every route prerenders) to `out/`.
  output: "export",
  // No next/image today; keep export from requiring the image optimizer.
  images: { unoptimized: true },
};

export default nextConfig;
