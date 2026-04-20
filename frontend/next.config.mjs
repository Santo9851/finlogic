/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone image
  output: 'standalone',

  // Allow external images (Unsplash placeholders used in team cards)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
