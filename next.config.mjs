import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx$/,
});

const nextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["katex", "mermaid", "minisearch"],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) {
      config.watchOptions = {
        ignored: ["**/node_modules", "**/public/generated/**", "**/.pipeline-cache/**"],
      };
    }
    return config;
  },
};

export default withMDX(nextConfig);
