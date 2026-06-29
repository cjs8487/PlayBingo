/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { version } = require('./package.json');

const isDev = process.env.NEXT_PUBLIC_API_PATH.startsWith('http://localhost');

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '*' },
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
        ],
        dangerouslyAllowLocalIP: isDev,
    },
    env: {
        version,
    },
    trailingSlash: true,
    turbopack: {
        root: path.join(__dirname, '..'),
    },
};

module.exports = nextConfig;
