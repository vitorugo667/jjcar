/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para compilar pacotes workspace que exportam TypeScript direto
  transpilePackages: ['@jjcar/shared'],
