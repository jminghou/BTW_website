/** @type {import('next').NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // 讓 Next 不要打包這兩個套件，保留原生 node_modules 結構，
    // 否則 @sparticuz/chromium 的二進位解壓與 puppeteer-core 的 executablePath 會失效。
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
};

module.exports = config; 