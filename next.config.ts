import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/birthday-project",
        assetPrefix: "/birthday-project/",
        images: {
          unoptimized: true,
        },
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
