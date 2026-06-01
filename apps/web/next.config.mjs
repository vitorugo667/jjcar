/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jjcar/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
 