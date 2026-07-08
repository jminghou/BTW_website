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
  async headers() {
    return [
      {
        // 電子看板共用素材（字型/logo/css/js）：檔名穩定、極少更動。
        // 給長快取讓播放盒（安卓盒/電視瀏覽器）下載一次後長期走本機快取，
        // 大幅降低反覆播放時的頻寬；共用素材有更新時最慢隔天生效（SWR 一週內背景更新）。
        source: '/signage-assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

module.exports = config; 