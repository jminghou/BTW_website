'use client'
import React from 'react'
// 移除未使用的導入
// import { useState } from 'react'
// import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a 
            href="#" 
            className="text-2xl font-bold cursor-pointer hover:text-gray-600"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Logo
          </a>
          <div className="hidden md:flex space-x-8">
            <a href="#about" className="hover:text-gray-600">關於BTW</a>
            <a href="#services" className="hover:text-gray-600">企業服務</a>
            <a href="#restaurant" className="hover:text-gray-600">餐廳招募</a>
            <a href="#investors" className="hover:text-gray-600">投資人關係</a>
            <a href="#contact" className="hover:text-gray-600">聯絡我們</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 