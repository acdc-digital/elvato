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
const path = require("path")

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [path.resolve(__dirname, "../convex")],
  webpack: (config) => {
    // Ensure modules imported from ../convex resolve deps from storefront/node_modules
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      ...(config.resolve.modules || ["node_modules"]),
    ]
    return config
  },
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
