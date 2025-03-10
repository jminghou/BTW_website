'use client';

import { useState } from 'react';

const Services = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const images = [
      { src: '/images/album/mp_01.jpg', alt: '智能熱食取餐機' },
      { src: '/images/album/mp_02.jpg', alt: '智能熱食取餐機' },
      { src: '/images/album/mp_03.jpg', alt: '智能熱食取餐機' },
    ];

    // 添加滚动到 Services02 部分的函数
    const scrollToServices02 = () => {
      const services02Section = document.getElementById('services-02');
      if (services02Section) {
        services02Section.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // 添加滚动到 Advantages 部分的函数
    const scrollToAdvantages = () => {
      const advantagesSection = document.getElementById('all-one');
      if (advantagesSection) {
        advantagesSection.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <div className="container mx-auto px-6">
        
        {/* 创建弹性布局容器 */}
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-center">
          {/* 左侧图片 */}
          <div className="w-full md:w-[45%] md:pr-4">
            <img 
              src="/images/landingpage/machine.jpg" 
              alt="智能熱食取餐機" 
              className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
            />
          </div>
          
          {/* 右侧文字区域 */}
          <div className="w-full md:w-[45%] md:pl-6">
            {/* 标题区域移至右侧 */}
            <h2 className="text-3xl font-bold mb-2">智能熱食取餐機服務</h2>
            {/* 添加分隔线 */}
            <div className="w-full h-px bg-black mb-2"></div>
            {/* 副标题加大 */}
            <h3 className="text-xl mb-8">我們專注解決企業用餐的雙重困境： </h3>
            
            <p className="text-base leading-7 text-gray-600">
            傳統外送：高成本/易延誤/餐品失溫
            </p>
            <p className="text-base leading-7 text-gray-600 mb-3">
            團膳供餐：選擇少/誤取率高/食物浪費
            </p>

            <p className="text-sm leading-7 text-gray-600 pt-4 mb-6">
            我們的創新服務為企業打造員工餐食解決方案，以物聯網系統實現完整訂餐流程，支援公司餐補及多種付買方式。
            </p>

            {/* 按钮区域移至右侧文字区 */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button 
                onClick={scrollToServices02}
                className="px-6 py-2 bg-[#00bed6] text-white rounded-lg hover:bg-[#ffb71b] transition-colors duration-300 shadow-md hover:shadow-lg text-base font-medium"
              >
                服務流程
              </button>
              <button 
                onClick={scrollToAdvantages}
                className="px-6 py-2 bg-[#00bed6] text-white rounded-lg hover:bg-[#ffb71b] transition-colors duration-300 shadow-md hover:shadow-lg text-base font-medium"
              >
                服務優勢
              </button>
            </div>
          </div>
        </div>

        {/* 相簿照片网格移至底部 */}
        <div className="max-w-xl mx-auto mt-16">
          <div className="grid grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="flex items-center justify-center">
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  onClick={() => setSelectedImage(image.src)}
                  className="max-h-full max-w-full object-contain rounded-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 图片预览模态框 */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] mx-4">
              <img 
                src={selectedImage} 
                alt="预览图片"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

export default Services;