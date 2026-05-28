import type { NextConfig } from 'next';

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'jscampbell21@outlook.com';

const nextConfig: NextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_SUPPORT_EMAIL: supportEmail,
  },
};

export default nextConfig;
