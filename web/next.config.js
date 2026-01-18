/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
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
    turbopack: {
        root: path.join(__dirname, '..'),
    },
};

module.exports = nextConfig;
