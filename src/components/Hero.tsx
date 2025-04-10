'use client'

import { useState, useEffect } from 'react';
import HeroGradient from './Hero_Gradient';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/images/ad/test01.jpg',
    '/images/ad/test02.jpg'
  ];

  // 自動輪播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 每5秒切換一次
    
    return () => clearInterval(interval);
  }, []);

  // 手動切換到指定幻燈片
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // 前後導航
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      // 使用浏览器默认的平滑滚动
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HeroGradient>
      <div className="flex items-center justify-center flex-grow">
        <div className="container mx-auto px-4">
          {/* 輪播版位 */}
          <div className="relative flex justify-center">
            {/* 輪播圖片 - 使用淡入淡出效果 */}
            <div className="relative w-full max-w-4xl h-auto">
              {slides.map((slide, index) => (
                <div 
                  key={index} 
                  className={`transition-opacity duration-1000 ease-in-out ${
                    currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  style={{ position: index === currentSlide ? 'relative' : 'absolute', top: 0, left: 0, right: 0 }}
                >
                  <img 
                    src={slide}
                    alt={`廣告輪播 ${index + 1}`}
                    className="w-full h-auto shadow-2xl rounded-3xl"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* 指示器 */}
          <div className="flex justify-center mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 mx-1 rounded-full ${currentSlide === index ? 'bg-white' : 'bg-gray-300'}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
          
          {/* 下箭头符号 */}
          <div 
            className="w-full text-center text-white text-6xl cursor-pointer hover:text-logo-color transition-colors duration-300 mt-8 font-bold animate-bounce"
            onClick={scrollToAbout}
          >
            ︾
          </div>
        </div>
      </div>
    </HeroGradient>
  )
}

export default Hero