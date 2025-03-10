'use client';

import { useState } from 'react';

const Services02 = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = [
    { src: '/images/album/all_01.jpg', alt: 'All for One 送餐服務' },
    { src: '/images/album/all_02.jpg', alt: 'All for One 送餐服務' },
    { src: '/images/album/all_03.jpg', alt: 'All for One 送餐服務' },
    { src: '/images/album/all_04.jpg', alt: 'All for One 送餐服務' },
  ];

  return (
    <div className="container mx-auto px-6">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4 pb-4 border-b border-black">
            線上訂餐 + All for One 送餐
          </h2>
          
          {/* 三栏图片布局 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 max-w-3xl mx-auto">
            {/* 第一栏 */}
            <div className="flex flex-col items-center">
              <img 
                src="/images/landingpage/step_1.png" 
                alt="步驟一" 
                className="w-40 h-auto object-contain mb-2"
              />
              <p className="text-base font-medium">Step 1</p>
            </div>
            
            {/* 第二栏 */}
            <div className="flex flex-col items-center justify-center">
              <img 
                src="/images/landingpage/step_2.png" 
                alt="步驟二" 
                className="w-40 h-auto object-contain mb-2"
              />
              <p className="text-base font-medium">Step 2</p>
            </div>
            
            {/* 第三栏 */}
            <div className="flex flex-col items-center">
              <img 
                src="/images/landingpage/step_3.jpg" 
                alt="步驟三" 
                className="w-40 h-auto object-contain rounded-lg shadow-lg mb-2"
              />
              <p className="text-base font-medium">Step 3</p>
            </div>
          </div>

          {/* 文字说明区块 */}
          <div className="mt-12 max-w-3xl mx-auto space-y-4 text-left">
            <p className="text-base text-gray-700">
              Step1. 同仁透過Line進行線上點餐
            </p>
            <p className="text-base text-gray-700">
              Step2. BTW的送餐團隊穿梭各地，領取多間店家的美食餐點並送達機器補餐
            </p>
            <p className="text-base text-gray-700">
              Step3. 透過掃描QRCode或員工卡從智能熱食取餐機領取餐點
            </p>
          </div>

          {/* 相册区块 */}
          <div className="mt-2 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allImages.map((image, index) => (
                <div key={index} className="aspect-square flex items-center justify-center">
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
  );
};

export default Services02;
