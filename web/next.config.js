const { version } = require( './package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {protocol: 'https', hostname: "*"},
            {protocol: 'http', hostname: "localhost"}
        ]
    },
    env: {
        version
    },
    experimental: {
        instrumentationHook: true,
    }
};

module.exports = nextConfig;
