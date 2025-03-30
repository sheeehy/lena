/** @type {import('next').NextConfig} */
const nextConfig = {

devIndicators: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;

