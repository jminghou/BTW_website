/** @type {import('next').NextConfig} */
const config = {
  eslint: {
    // 在生產環境構建時忽略 ESLint 錯誤
    ignoreDuringBuilds: true,
  },
};

module.exports = config; 