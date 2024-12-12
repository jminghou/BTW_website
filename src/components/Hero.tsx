'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react';
import ImageSlideshow from './ImageSlideshow'
import Button from './buttons/Button'

const Hero = () => {
  const slideImages = [
    '/images/landingpage/s01.png', 
    '/images/landingpage/s02.png',
    '/images/landingpage/s03.png',
    '/images/landingpage/s04.png', 
    '/images/landingpage/s05.png',
    '/images/landingpage/s06.png'
  ];

  return (
    <div className="relative h-screen bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('/images/landingpage/banner_food.jpg')" }}>
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto">
            {/* 左側幻燈片 */}
            <div className="w-full md:w-1/2">
              <div className="max-w-md mx-auto relative">
                <ImageSlideshow 
                  images={slideImages} 
                  className="w-full mx-auto mt-0 ml-0 md:ml-[80px]"
                />
              </div>
            </div>
            
            {/* 右側文字和按鈕 */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">熱食智能取餐第一品牌</h1>
              <p className="text-xl mb-8 text-white">天天換餐點 | 餐餐不失溫</p>
              
              <div className="space-x-4 flex justify-center md:justify-start">
                <Button variant="neumorphic">
                  企業合作
                </Button>
                <Button variant="neumorphic">
                  餐廳合作
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero