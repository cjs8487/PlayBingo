// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '*' },
            { protocol: 'http', hostname: 'localhost' },
        ],
    },
    env: {
        version,
    },
    trailingSlash: true,
};

module.exports = nextConfig;
