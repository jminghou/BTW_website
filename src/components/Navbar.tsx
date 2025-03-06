'use client'
import React from 'react'
import Image from 'next/image'

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <a 
            href="#" 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <Image
              src="/svg/btw_logo_b.svg"
              alt="BTW Logo"
              width={240}
              height={30}
              className="h-auto"
              priority
            />
          </a>
          <div className="hidden md:flex space-x-8">
            <a href="#about" className="text-custom-dark hover:text-logo-color">關於BTW</a>
            <a href="#services" className="text-custom-dark hover:text-logo-color">企業服務</a>
            <a href="#restaurant" className="text-custom-dark hover:text-logo-color">餐廳招募</a>
            <a href="#investors" className="text-custom-dark hover:text-logo-color">投資人關係</a>
            <a href="#contact" className="text-custom-dark hover:text-logo-color">聯絡我們</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 