import { withPayload } from '@payloadcms/next/withPayload'
import nextra from 'nextra'
import redirects from './redirects.js'

const withNextra = nextra({
  search: true,
})


const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  async headers() { return [ { source: '/(.*)', headers: [ { key: 'Cross-Origin-Opener-Policy', value: 'same-origin', }, ], }, ]; },
  reactStrictMode: true,
  redirects,
}

export default withPayload(withNextra(nextConfig), { devBundleServerPackages: false })
