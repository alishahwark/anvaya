import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a second server (tests, production check) use its own build directory so it never clobbers `next dev`.
  distDir: process.env.ANVAYA_DIST_DIR || ".next",
  // pdf-parse reads files at import time in some bundles; keep it a plain Node dependency.
  serverExternalPackages: ["pdf-parse", "@libsql/client"],
};
export default nextConfig;
