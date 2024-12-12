import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// 設定 Inter 字體
const inter = Inter({ subsets: ['latin'] })

// 設定網站的基本元數據
export const metadata: Metadata = {
  title: 'ByTheWay 浩華智能取餐',
  description: '您的網站描述',
  keywords: '智能取餐, 熱食便當機, 輪動便當機, 熱食便當機推薦, 輪動便當機推薦,',
  authors: [{ name: 'BTW' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* 如果需要添加其他 head 元素 */}
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* 如果需要添加全局組件，例如加載指示器或分析工具 */}
        <div className="min-h-screen">
          {children}
        </div>
        {/* 如果需要添加全局頁尾 */}
      </body>
    </html>
  )
}