import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client", "bcryptjs"]
};

export default withNextIntl(nextConfig);
