import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import StyledComponentsRegistry from './lib/registry'

// 設定 Inter 字體
const inter = Inter({ subsets: ['latin'] })

// 設定網站的基本元數據
export const metadata: Metadata = {
  title: 'ByTheWay 浩華智能取餐 | 企業智能熱食取餐機服務專家',
  description: '浩華企業專注於提供企業智能熱食取餐機服務，解決企業用餐困境。以智能科技實現「免等待外送・破單調團膳」，用低碳模式打造「高效能・零浪費」的職場餐飲生態。服務台灣百大企業，提升員工用餐體驗。',
  keywords: '智能取餐, 熱食便當機, 輪動便當機, 熱食便當機推薦, 輪動便當機推薦, 企業用餐解決方案, 智能餐飲服務, 企業團膳替代, 職場餐飲管理, 零浪費餐飲解決方案, 員工餐食服務, 智能熱食取餐機, All-in-One餐飲服務',
  authors: [{ name: '浩華企業ByTheWay' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://www.btwmeals.com/',
    siteName: 'ByTheWay 浩華智能取餐',
    title: '浩華企業 - 企業智能熱食取餐機服務專家',
    description: '專注解決企業用餐困境，為台灣百大企業提供智能熱食取餐機服務，以創新科技提升員工用餐體驗。',
    images: [
      {
        url: '/images/landingpage/machine.jpg',
        width: 1200,
        height: 630,
        alt: '浩華智能熱食取餐機最新消息',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '浩華企業 - 企業智能熱食取餐機服務專家',
    description: '專注解決企業用餐困境，為台灣百大企業提供智能熱食取餐機服務，以創新科技提升員工用餐體驗。',
    images: ['/images/landingpage/machine.jpg'],
  },
  alternates: {
    canonical: 'https://www.btwmeals.com/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className="scroll-smooth">
      <head>
        <link rel="icon" href="/btw_bird_logo.ico" />
        <link rel="apple-touch-icon" href="/btw_bird_logo.ico" />
        <link rel="shortcut icon" href="/btw_bird_logo.ico" />
        {/* 其他 head 元素 */}
      </head>
      <body className={`${inter.className} antialiased`}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  )
}