const About = () => {
    return (
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">關於BTW</h2>
        
        {/* 創建相對定位的容器來實現重疊效果 */}
        <div className="relative max-w-6xl mx-auto">
          {/* 右側圖片 - 在手機版時佔滿寬度 */}
          <div className="w-full md:w-[60%] md:ml-auto">
            <img 
              src="/images/landingpage/about_us.jpg" 
              alt="關於我們" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          
          {/* 左側文字框 - 在手機版時變成普通流式布局 */}
          <div className="relative md:absolute md:left-0 md:top-[25px] w-full md:w-[45%] 
                        bg-white p-8 rounded-lg shadow-xl mt-4 md:mt-0">
            <p className="text-base leading-8 text-gray-600">
            浩華企業股份有限公司成立於2016年
            </p>
            <p className="text-base leading-8 text-gray-600">
            長年致力於革新企業餐飲服務模式！
            </p>
            <p className="text-base leading-8 text-gray-600 pt-4">
            作為台灣領先的企業餐飲服務供應商，我們以創新的智能熱食取餐系統，為各大企業提供便捷、衛生、高效的餐飲服務體驗。
            </p>
            <p className="text-base leading-8 text-gray-600">
           透過科技創新成為熱食智能取餐第一品牌, 我們立志為企業打造更優質的餐飲服務。
            </p>
            <p className="text-base leading-8 text-gray-600 pt-4">
            我們相信良好的用餐體驗能提升員工幸福感，進而帶動企業正向發展。
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  export default About