const Ser_Office = () => {
  return (
    <div className="container mx-auto px-6">
          
          {/* 創建相對定位的容器來實現重疊效果 */}
          <div className="relative max-w-6xl mx-auto">
            {/* 左側圖片 */}
            <div className="w-full md:w-[36%]">
              <img 
                src="/images/services/ser_iphone.jpg" 
                alt="關於我們" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            {/* 文字框 - 在手機版時位於圖片下方，桌面版時位於右側重疊 */}
            <div className="w-full mt-6 md:mt-0 md:absolute md:right-0 md:top-[25px] md:w-[66%] bg-white p-8 rounded-lg shadow-xl">
            <p className="text-2xl font-bold leading-8 text-gray-600">
            辦公室團購便當
            </p>

            <p className="text-base leading-8 text-gray-600">
            我們提供每日多樣的餐點選擇，集中配送更能有效降低企業用餐成本，
            </p>
            <p className="text-base leading-8 text-gray-600">
            完整的線上訂餐系統實現無紙化操作，
            </p>
            <p className="text-base leading-8 text-gray-600">
            減少碳足跡、無紙化流程實踐企業節能減碳理念。
            </p>
  

  
            </div>
          </div>
        </div>
      )
      }

export default Ser_Office
