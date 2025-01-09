import Image from 'next/image';

const Ser_Machine = () => {
    return (
        <div className="container mx-auto px-6">

          
          {/* 創建相對定位的容器來實現重疊效果 */}
          <div className="relative max-w-6xl mx-auto">
            {/* 左側圖片 */}
            <div className="w-full md:w-[36%]">
              <img 
                src="/images/services/ser_machine.jpg" 
                alt="關於我們" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            {/* 文字框 - 在手機版時位於圖片下方，桌面版時位於右側重疊 */}
            <div className="w-full mt-6 md:mt-0 md:absolute md:right-0 md:top-[25px] md:w-[66%] bg-white p-8 rounded-lg shadow-xl">
            <p className="text-2xl font-bold leading-8 text-gray-600">
            智能熱食取餐機
            </p>

            <p className="text-base leading-8 text-gray-600">
            我們提供每日多樣的餐點選擇，智能熱食機避免餐點暴露在外，
            </p>
            <p className="text-base leading-8 text-gray-600">
            65度保溫技術確保餐點品質，清晰的餐點資訊讓取餐過程快速有效率，
            </p>
            <p className="text-base leading-8 text-gray-600">
            節能設計、無紙化操作實踐企業ESG永續理念。
            </p>
  

  
            </div>
          </div>
        </div>
      )
      }

export default Ser_Machine
