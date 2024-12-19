import Image from 'next/image';
import GoldenButton from './buttons/GoldenButton'

const Restaurant = () => {
  return (
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-12">餐廳招募</h2>
      
      {/* 創建相對定位的容器來實現重疊效果 */}
      <div className="relative max-w-6xl mx-auto">
          {/* 右側圖片 - 在手機版時佔滿寬度 */}
          <div className="w-full md:w-[60%] md:ml-auto">
          <img 
            src="/images/landingpage/restaurant.jpg" 
            alt="關於我們" 
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        
         {/* 左側文字框 - 在手機版時變成普通流式布局 */}
         <div className="relative md:absolute md:left-0 md:top-[25px] w-full md:w-[45%] 
           bg-white p-8 rounded-lg shadow-xl mt-4 md:mt-0"> 
          <p className="text-2xl font-bold leading-10 text-gray-600">
          您在尋找業務成長機會嗎？
          </p>
          <p className="text-3xl font-bold leading-10 text-gray-600">
          歡迎加入BTW的行列！
          </p>
          <ul className="text-base pt-6 leading-6 text-gray-600 list-disc pl-5 space-y-2">
            <li>打入龐大的科技園區市場，觸及數以萬計的企業員工</li>
            <li>提前向您下單，方便預測數量，提早管理食材庫存</li>
            <li>集中配送服務，降低物流成本，提升營運效率</li>
            <li>智能熱食取餐機能確保餐點品質，65度恆溫兼具抑菌功能</li>
          </ul>

          <div className="space-x-4 pt-6 flex justify-center md:justify-start">
                <GoldenButton>
                  餐廳合作方案
                </GoldenButton>
          </div>

        </div>
      </div>
    </div>
  )
  }
  
  export default Restaurant