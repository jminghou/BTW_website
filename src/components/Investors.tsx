import Image from 'next/image';
import GoldenButton from './buttons/GoldenButton'

  const Investors = () => {
    return (
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">投資人關係</h2>
        
        {/* 創建相對定位的容器來實現重疊效果 */}
        <div className="relative max-w-6xl mx-auto">
          {/* 左側圖片 */}
          <div className="w-full md:w-[60%]">
            <img 
              src="/images/landingpage/investment.jpg" 
              alt="關於我們" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          
          {/* 文字框 - 在手機版時位於圖片下方，桌面版時位於右側重疊 */}
          <div className="w-full mt-6 md:mt-0 md:absolute md:right-0 md:top-[25px] md:w-[45%] bg-white p-8 rounded-lg shadow-xl">
          <p className="text-2xl font-bold leading-8 text-gray-600">
          投資浩華企業
          </p>
          <p className="text-3xl font-bold leading-10 text-gray-600">
          把握智慧餐飲新商機
          </p>
          <ul className="text-base pt-6 text-gray-600 list-disc pl-5 space-y-2">
            <li>市場潛力：目標客戶涵蓋台灣數千家科技大廠</li>
            <li>創新科技：防疫型智能餐食供應系統專利</li>
            <li>商業模式：設備租賃+餐飲服務雙收入，創造穩定現金流</li>
            <li>成長策略：拓展企業客戶，打造全台最大企業餐飲服務網絡</li>
          </ul>

          <div className="space-x-4 flex justify-center md:justify-start pt-6">
                <GoldenButton>
                  下載募資簡報
                </GoldenButton>
          </div>

          </div>
        </div>
      </div>
    )
    }
    
    export default Investors