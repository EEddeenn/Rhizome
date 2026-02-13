import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const withMDX = createMDX({
  extension: /\.mdx$/,
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withMDX(nextConfig);
