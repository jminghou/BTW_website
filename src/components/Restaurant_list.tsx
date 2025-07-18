"use client";

import React, { useState } from 'react';

const RestaurantList = () => {
  // 创建全台连锁餐厅logo图片数组
  const restaurantLogos = Array.from({ length: 18 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/999/${number}.jpg`;
  });

  // 创建台北餐厅logo图片数组
  const taipeiLogos = Array.from({ length: 11 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Taipei/t${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  taipeiLogos.push('/images/logo_restaurant/plus.png');

  // 创建桃园餐厅logo图片数组
  const tyuLogos = Array.from({ length: 11 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Tyu/ty${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  tyuLogos.push('/images/logo_restaurant/plus.png');

  // 创建新竹餐厅logo图片数组
  const hsLogos = Array.from({ length: 11 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Hs/hs${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  hsLogos.push('/images/logo_restaurant/plus.png');

  // 创建台中餐厅logo图片数组
  const tchLogos = Array.from({ length: 5 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Tch/tc${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  tchLogos.push('/images/logo_restaurant/plus.png');

  // 创建台南餐厅logo图片数组
  const tnaLogos = Array.from({ length: 5 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Tna/tn${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  tnaLogos.push('/images/logo_restaurant/plus.png');

  // 创建高雄餐厅logo图片数组
  const kaoLogos = Array.from({ length: 5 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/Kao/k${number}.jpg`;
  });
  // 添加plus.png作为最后一个logo
  kaoLogos.push('/images/logo_restaurant/plus.png');

  // 添加状态来控制是否显示更多餐厅
  const [showMore, setShowMore] = useState(false);
  
  // 添加状态來追蹤哪些圖片被點擊變成彩色
  const [coloredImages, setColoredImages] = useState<Set<string>>(new Set());

  // 將全台连锁餐厅logo分成两部分：前12个(前2排)和后6个(最后一排)
  const firstTwoRows = restaurantLogos.slice(0, 12);
  const lastRow = restaurantLogos.slice(12);

  // 將台北餐厅logo分成两排，每排6个
  const taipeiFirstRow = taipeiLogos.slice(0, 6);
  const taipeiSecondRow = taipeiLogos.slice(6, 12);

  // 將桃园餐厅logo分成两排，每排6个（如果不够12个，第二排会不满）
  const tyuFirstRow = tyuLogos.slice(0, 6);
  const tyuSecondRow = tyuLogos.slice(6);

  // 將新竹餐厅logo分成两排，每排6个（如果不够12个，第二排会不满）
  const hsFirstRow = hsLogos.slice(0, 6);
  const hsSecondRow = hsLogos.slice(6);

  // 添加滚动到Contact部分的函数
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 處理圖片點擊，切換彩色狀態
  const handleImageClick = (imageId: string, isSpecialAction?: boolean) => {
    if (isSpecialAction) {
      scrollToContact();
      return;
    }
    
    setColoredImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  return (
    <div className="mt-12 mb-12">
      <h3 className="text-2xl font-bold text-center mb-8">目前合作餐廳 (全台連鎖)</h3>
      
      {/* 显示前两排(12个)餐厅logo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
        {firstTwoRows.map((logo, index) => {
          const imageId = `main-${index}`;
          const isColored = coloredImages.has(imageId);
          return (
            <div 
              key={index} 
              className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
              onClick={() => handleImageClick(imageId)}
            >
              <img 
                src={logo} 
                alt={`合作餐廳 ${index + 1}`} 
                className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                  isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0'
                }`}
              />
            </div>
          );
        })}
      </div>
      
      {/* 显示"更多餐厅"按钮 */}
      <div className="flex justify-center mt-8 mb-6 max-w-6xl mx-auto">
        <button 
          onClick={() => setShowMore(!showMore)}
          className="w-full px-8 py-3 bg-logo-color text-gray-500 font-semibold rounded-md hover:bg-[#ffb71b] transition-colors shadow-md flex items-center justify-center border border-logo-color"
        >
          <span className="text-gray-500 ">{showMore ? '收起' : '展開更多餐廳'}</span>
          <svg 
            className={`ml-2 w-5 h-5 transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
      
      {/* 第三排全台連鎖餐厅logo和台北餐厅logo，根据状态控制显示 */}
      {showMore && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mt-6 animate-fade-in">
            {lastRow.map((logo, index) => {
              const imageId = `main-${index + 12}`;
              const isColored = coloredImages.has(imageId);
              return (
                <div 
                  key={index + 12} 
                  className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(imageId)}
                >
                  <img 
                    src={logo} 
                    alt={`合作餐廳 ${index + 13}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 台北合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">台北合作餐廳 50+</h3>
          
          {/* 台北餐厅logo第一排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {taipeiFirstRow.map((logo, index) => {
              const imageId = `taipei-${index}`;
              const isColored = coloredImages.has(imageId);
              return (
                <div 
                  key={`taipei-${index}`} 
                  className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(imageId)}
                >
                  <img 
                    src={logo} 
                    alt={`台北合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 台北餐厅logo第二排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mt-4 animate-fade-in">
            {taipeiSecondRow.map((logo, index) => {
              const imageId = `taipei-${index + 6}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = index === 5;
              return (
                <div 
                  key={`taipei-${index + 6}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `台北合作餐廳 ${index + 7}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">台北餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 桃园合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">桃園合作餐廳 60+</h3>
          
          {/* 桃园餐厅logo第一排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {tyuFirstRow.map((logo, index) => {
              const imageId = `tyu-${index}`;
              const isColored = coloredImages.has(imageId);
              return (
                <div 
                  key={`tyu-${index}`} 
                  className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(imageId)}
                >
                  <img 
                    src={logo} 
                    alt={`桃園合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 桃园餐厅logo第二排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mt-4 animate-fade-in">
            {tyuSecondRow.map((logo, index) => {
              const imageId = `tyu-${index + 6}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = logo.includes('plus.png');
              return (
                <div 
                  key={`tyu-${index + 6}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `桃園合作餐廳 ${index + 7}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">桃園餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 新竹合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">新竹合作餐廳 80+</h3>
          
          {/* 新竹餐厅logo第一排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {hsFirstRow.map((logo, index) => {
              const imageId = `hs-${index}`;
              const isColored = coloredImages.has(imageId);
              return (
                <div 
                  key={`hs-${index}`} 
                  className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(imageId)}
                >
                  <img 
                    src={logo} 
                    alt={`新竹合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* 新竹餐厅logo第二排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mt-4 animate-fade-in">
            {hsSecondRow.map((logo, index) => {
              const imageId = `hs-${index + 6}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = logo.includes('plus.png');
              return (
                <div 
                  key={`hs-${index + 6}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `新竹合作餐廳 ${index + 7}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">新竹餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 台中合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">台中合作餐廳 25+</h3>
          
          {/* 台中餐厅logo单排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {tchLogos.map((logo, index) => {
              const imageId = `tch-${index}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = logo.includes('plus.png');
              return (
                <div 
                  key={`tch-${index}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `台中合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">台中餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 台南合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">台南合作餐廳 25+</h3>
          
          {/* 台南餐厅logo单排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {tnaLogos.map((logo, index) => {
              const imageId = `tna-${index}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = logo.includes('plus.png');
              return (
                <div 
                  key={`tna-${index}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `台南合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">台南餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 高雄合作餐厅标题 */}
          <h3 className="text-2xl font-bold text-center mt-6 mb-6">高雄合作餐廳 25+</h3>
          
          {/* 高雄餐厅logo单排 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto animate-fade-in">
            {kaoLogos.map((logo, index) => {
              const imageId = `kao-${index}`;
              const isColored = coloredImages.has(imageId);
              const isPlusIcon = logo.includes('plus.png');
              return (
                <div 
                  key={`kao-${index}`} 
                  className={`flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${isPlusIcon ? 'relative group' : ''}`}
                  onClick={() => handleImageClick(imageId, isPlusIcon)}
                >
                  <img 
                    src={logo} 
                    alt={isPlusIcon ? '加入我們' : `高雄合作餐廳 ${index + 1}`} 
                    className={`w-full h-auto object-contain transition-all duration-300 hover:scale-110 ${
                      isPlusIcon ? 'filter-none' : (isColored ? 'filter-none opacity-100' : 'filter grayscale opacity-75 hover:opacity-100 hover:grayscale-0')
                    }`}
                  />
                  {isPlusIcon && (
                    <div className="absolute inset-0 bg-[#ffb71b] bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                      <span className="text-black font-semibold text-2xl">高雄餐廳</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantList; 