"use client";

import React from 'react';
import RestaurantList from './Restaurant_list';

const Restaurant = () => {
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

        {/* 引入餐厅列表组件 */}
        <RestaurantList />
    </div>
  );
};

export default Restaurant;