'use client'
import React, { useState } from 'react'
import Image from 'next/image'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
          
          {/* 桌面選單 */}
          <div className="hidden md:flex space-x-8">
            <a href="#about" className="text-custom-dark hover:text-logo-color">關於BTW</a>
            <a href="#services" className="text-custom-dark hover:text-logo-color">企業服務</a>
            <a href="#restaurant" className="text-custom-dark hover:text-logo-color">餐廳招募</a>
            <a href="#investors" className="text-custom-dark hover:text-logo-color">投資人關係</a>
            <a href="#contact" className="text-custom-dark hover:text-logo-color">聯絡我們</a>
          </div>
          
          {/* 漢堡選單按鈕 */}
          <div className="block md:hidden">
            <button 
              className="flex flex-col justify-center items-center w-10 h-10 border-2 border-gray-300 rounded p-2 hover:bg-gray-100"
              onClick={toggleMenu}
              aria-label="開啟選單"
            >
              <span className={`block w-full h-0.5 bg-gray-800 mb-1.5 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-full h-0.5 bg-gray-800 mb-1.5 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-full h-0.5 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>
        
        {/* 行動裝置選單 */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-60 opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col space-y-4">
            <a href="#about" className="text-custom-dark hover:text-logo-color" onClick={() => setIsMenuOpen(false)}>關於BTW</a>
            <a href="#services" className="text-custom-dark hover:text-logo-color" onClick={() => setIsMenuOpen(false)}>企業服務</a>
            <a href="#restaurant" className="text-custom-dark hover:text-logo-color" onClick={() => setIsMenuOpen(false)}>餐廳招募</a>
            <a href="#investors" className="text-custom-dark hover:text-logo-color" onClick={() => setIsMenuOpen(false)}>投資人關係</a>
            <a href="#contact" className="text-custom-dark hover:text-logo-color" onClick={() => setIsMenuOpen(false)}>聯絡我們</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar