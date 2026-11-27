/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === "1";
const basePath = isVercel ? "" : process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  // GitHub Pages needs a static export under /aicommit.
  // Vercel serves the app from the domain root with the Next.js runtime.
  ...(isVercel ? {} : { output: "export" }),
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: !isVercel,
  },
  transpilePackages: ["geist"],
};

export default nextConfig;
