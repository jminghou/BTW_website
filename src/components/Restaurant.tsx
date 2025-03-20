"use client";

import React from 'react';

const Restaurant = () => {
  // 创建餐厅logo图片数组
  const restaurantLogos = Array.from({ length: 18 }, (_, i) => {
    // 编号从1开始，需要补0
    const number = (i + 1).toString().padStart(2, '0');
    return `/images/logo_restaurant/999/${number}.jpg`;
  });

  // 添加状态来控制是否显示更多餐厅
  const [showMore, setShowMore] = React.useState(false);

  // 将餐厅logo分成两部分：前12个(前2排)和后6个(最后一排)
  const firstTwoRows = restaurantLogos.slice(0, 12);
  const lastRow = restaurantLogos.slice(12);

  return (
    <div className="container mx-auto px-6">
        
        {/* 创建弹性布局容器 */}
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-center">
          {/* 左侧图片 */}
          <div className="w-full md:w-[45%] md:pr-4">
            <img 
              src="/images/landingpage/restaurant.jpg" 
              alt="智能熱食取餐機" 
              className="w-full max-w-md mx-auto rounded-3xl shadow-xl"
            />
          </div>
          
          {/* 右侧文字区域 */}
          <div className="w-full md:w-[45%] md:pl-6">
            {/* 标题区域 */}
            <h2 className="text-3xl font-bold mb-4">餐廳招募</h2>
            
            {/* 添加分隔线 */}
            <div className="w-full h-px bg-black mb-6"></div>

            {/* 优势列表 */}
            <div className="space-y-6">
              <div>
                <p className="text-base text-gray-700 leading-loose">浩華智能取餐正攜手百家餐廳，打造『線上訂餐・線下5秒取餐』的企業用餐新體驗！我們提供智能取餐機、穩定客源與高效配送系統，讓您的餐點直達企業員工手中，開拓全新市場商機。誠摯邀請您成為我們的服務夥伴，一起打造新型態餐飲服務，共創企業用餐的未來！</p>
              </div>

            </div>
          </div>
        </div>

        {/* 底部餐厅logo图片网格 */}
        <div className="mt-12 mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">目前合作餐廳 (全台連鎖)</h3>
          
          {/* 显示前两排(12个)餐厅logo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {firstTwoRows.map((logo, index) => (
              <div key={index} className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                <img 
                  src={logo} 
                  alt={`合作餐廳 ${index + 1}`} 
                  className="w-full h-auto object-contain transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
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
          
          {/* 第三排餐厅logo，根据状态控制显示 */}
          {showMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mt-6 animate-fade-in">
              {lastRow.map((logo, index) => (
                <div key={index + 12} className="flex items-center justify-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                  <img 
                    src={logo} 
                    alt={`合作餐廳 ${index + 13}`} 
                    className="w-full h-auto object-contain transition-transform duration-300 hover:scale-110"
                  />
                </div>
              ))}
            </div>
          )}
          
        </div>
    </div>
  )
  }
  
  export default Restaurant