/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/shop",
        destination: "https://shop.spreadshirt.nl/nuts/",
        permanent: true
      }
    ]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });

    return config;
  },
  experimental: {
    images: {
      allowFutureImage: true,
      unoptimized: true
    }
  },
  reactStrictMode: true,
  trailingSlash: true,
}

module.exports = nextConfig
