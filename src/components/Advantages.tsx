import React from 'react';

const Advantages = () => {
  return (
    <div className="container mx-auto px-6">
        
        {/* 创建弹性布局容器 */}
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-center">
          {/* 左侧图片 */}
          <div className="w-full md:w-[45%] md:pr-4">
            <img 
              src="/images/landingpage/box.jpg" 
              alt="智能熱食取餐機" 
              className="w-full max-w-md mx-auto rounded-3xl shadow-2xl"
            />
          </div>
          
          {/* 右侧文字区域 */}
          <div className="w-full md:w-[45%] md:pl-6">
            {/* 标题区域 */}
            <h2 className="text-3xl font-bold mb-4">智能熱食取餐機優勢</h2>
            
            {/* 添加分隔线 */}
            <div className="w-full h-px bg-black mb-6"></div>

            {/* 优势列表 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">1. 百間名店輪替｜天天換餐點餐餐自由選</h3>
                <p className="text-base text-gray-700">合作餐廳超過300家，餐餐享用名店美食</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">2. 獨立密封艙格｜隔絕污染保食安</h3>
                <p className="text-base text-gray-700">專利設計，隔絕飛沫、灰塵與溫濕度影響</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">3. 65°C恆溫保鮮｜三重食安防護</h3>
                <p className="text-base text-gray-700">智慧恆溫＋紫外線＋臭氧同步運作，完整守護</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">4. 智慧熱食機秒取餐｜簡單明確高效率</h3>
                <p className="text-base text-gray-700">智能取餐＋Line客服營運系統，平均5秒取餐不誤拿</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">5. 集約配送減碳30%｜預訂制零浪費</h3>
                <p className="text-base text-gray-700">單趟最多可滿足百人用餐需求，搭配預訂機制降低20%食材損耗</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Advantages;
