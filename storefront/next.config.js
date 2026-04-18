const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    staticGenerationMaxConcurrency: 10,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Custom loader routes Bunny CDN images through Bunny Optimizer
    // (width/quality query params) and passes other hosts through unchanged.
    // This avoids Vercel "image optimization transformation" charges, since
    // Bunny is already our image pipeline.
    loader: "custom",
    loaderFile: "./src/lib/util/image-loader.ts",
    // NOTE: `remotePatterns` below is retained as a safety net only.
    // With `loader: "custom"`, Next.js no longer uses its built-in
    // optimizer (`/_next/image`), so this allowlist is effectively unused
    // at runtime today. We keep it so that if the custom loader is ever
    // disabled or removed, image requests don't immediately break.
    // WARNING: this is NOT the source of truth for allowed image hosts in
    // the current architecture — the custom loader in
    // `src/lib/util/image-loader.ts` is. Update that file when adding new
    // image hosts; only mirror them here if you also expect to fall back
    // to the Next.js built-in optimizer.
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "cf.cjdropshipping.com",
      },
      {
        protocol: "https",
        hostname: "elvatoStorage-CDN.b-cdn.net",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3211",
      },
      {
        protocol: "https",
        hostname: "superb-dotterel-37.convex.site",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
