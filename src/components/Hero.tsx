'use client'

import { useState, useEffect } from 'react';

const Hero = () => {
  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      // 使用浏览器默认的平滑滚动
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-screen bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('/images/landingpage/banner_food.jpg')" }}>
      {/* 黑色遮罩层 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}></div>
      
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center max-w-5xl mx-auto">
            {/* 标题 */}
            <div className="w-full text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">美味．觸手可及</h1>
              <p className="text-xl mb-8 text-white">浩華智能餐飲｜企業高效用餐解決方案</p>
              
              {/* 下箭头符号 */}
              <div 
                className="text-white text-6xl cursor-pointer hover:text-logo-color transition-colors duration-300 mt-12 font-bold animate-bounce"
                onClick={scrollToAbout}
                style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
              >
                ︾
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero