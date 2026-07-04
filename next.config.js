/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  devIndicators: false, // hide the Next.js badge bottom-left in dev
};
module.exports = nextConfig;
