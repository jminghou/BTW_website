'use client'

import { useState } from 'react';

const Hero = () => {
  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      // 使用浏览器默认的平滑滚动
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-screen flex flex-col justify-center overflow-hidden">
      {/* 全屏視頻背景 */}
      <video 
        autoPlay 
        loop 
        muted 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/video/btw_video.mp4" type="video/mp4" />
        您的浏览器不支持视频标签。
      </video>
      
      {/* 從透明到白色的漸層覆蓋層 */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-10" 
        style={{ 
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.7) 70%, rgba(255, 255, 255, 1) 100%)' 
        }}
      ></div>
      
      {/* 內容區域 */}
      <div className="container mx-auto px-4 z-20 flex flex-col items-center justify-center flex-grow">
        {/* 主標題 */}
        <h1 className="text-black text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 tracking-wide">
          企業團膳．智能取餐
        </h1>
     
        <div className="w-2/3 h-px bg-black mb-6"></div>

        <h2 className="text-pretty text-lg md:text-lg lg:text-xl font-normal text-center mb-2 tracking-wide">
        百間名店輪替，天天換餐點，餐餐是熱食
        </h2>
        <h2 className="text-pretty text-lg md:text-lg lg:text-xl font-normal text-center mb-8 tracking-wide">
        5秒取餐、高效能、零浪費，美味觸手可及
        </h2>

        
        {/* 下箭头符号 - 改為黑色 */}
        <div 
          className="w-full text-center text-black text-6xl cursor-pointer hover:text-logo-color transition-colors duration-300 mt-8 font-bold animate-bounce"
          onClick={scrollToAbout}
        >
          ︾
        </div>
      </div>
    </div>
  )
}

export default Hero