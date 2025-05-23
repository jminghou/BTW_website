'use client';

import React from 'react';
import StandButton from './buttons/stand_buttons';

const Investors = () => {
  // 添加滚动到联系我们部分的函数
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto px-6">
      
      {/* 创建弹性布局容器 */}
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-center">
        {/* 左侧图片 */}
        <div className="w-full md:w-[45%] md:pr-4">
          <img 
            src="/images/landingpage/investment.jpg" 
            alt="智能熱食取餐機" 
            className="w-full max-w-md mx-auto rounded-3xl shadow-xl"
          />
        </div>
        
        {/* 右侧文字区域 */}
        <div className="w-full md:w-[45%] md:pl-6">
          {/* 标题区域 */}
          <h2 className="text-3xl font-bold mb-4">投資人關係</h2>
          
          {/* 添加分隔线 */}
          <div className="w-full h-px bg-black mb-6"></div>

          {/* 說明文字 */}
          <div className="space-y-6">
            <div>
              <p className="text-base text-gray-700 leading-loose">浩華智能取餐正引領企業用餐革命！我們解決傳統團膳效率低、選擇少的痛點，瞄準千億級企業用餐市場。創新商業模式已獲百家名店與指標企業採用，連續三年營收成長突破50%，立即聯絡我們，掌握智能餐飲的未來商機！</p>
            </div>

            {/* 添加标准按钮 */}
            <div className="mt-6">
              <StandButton 
                text="取得進一步資訊"
                onClick={scrollToContact}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 服務版圖 */}
      <div className="mt-8 mb-8">
        <img 
          src="/images/landingpage/map.jpg" 
          alt="服務版圖" 
          className="w-full max-w-5xl mx-auto"
        />
      </div>
    </div>
  )
}
  
export default Investors