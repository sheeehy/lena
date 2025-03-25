/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '**',
      },
      // Add any other domains you might need
    ],
  },
};

export default nextConfig;

