const Ser_AD = () => {
  return (
    <div className="container mx-auto px-6">
          
          {/* 創建相對定位的容器來實現重疊效果 */}
          <div className="relative max-w-6xl mx-auto">
            {/* 左側圖片 */}
            <div className="w-full md:w-[36%]">
              <img 
                src="/images/services/ser_ad.jpg" 
                alt="關於我們" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            {/* 文字框 - 在手機版時位於圖片下方，桌面版時位於右側重疊 */}
            <div className="w-full mt-6 md:mt-0 md:absolute md:right-0 md:top-[25px] md:w-[66%] bg-white p-8 rounded-lg shadow-xl">
            <p className="text-2xl font-bold leading-8 text-gray-600">
            廣告版位投放
            </p>
            <p className="text-base leading-8 text-gray-600">
            精準觸及科技大廠高質量受眾。每日用餐時段，
            </p>
            <p className="text-base leading-8 text-gray-600">
            您的品牌將直接展現在企業員工面前，創造高頻曝光機會。
            </p>
            <p className="text-base leading-8 text-gray-600">
            結合餐飲場景的創新廣告形式，為品牌帶來精準且具影響力的曝光效果。
            </p>
            
            </div>
          </div>
        </div>
      )
      }

export default Ser_AD
