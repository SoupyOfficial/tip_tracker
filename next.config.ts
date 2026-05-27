import type { NextConfig } from 'next';

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
if (!supportEmail) {
  console.warn(
    '[tip_tracker] NEXT_PUBLIC_SUPPORT_EMAIL is not set — support features will be disabled',
  );
}

const nextConfig: NextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_SUPPORT_EMAIL: supportEmail ?? '',
  },
};

export default nextConfig;
