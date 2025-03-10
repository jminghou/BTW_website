'use client'

const About = () => {
    const scrollToServices = () => {
      const servicesSection = document.getElementById('services');
      servicesSection?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
      <div className="container mx-auto px-6">
        
        {/* 创建弹性布局容器 */}
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-center mb-16 pt-4 md:pt-0">
          {/* 左侧图片 */}
          <div className="w-full md:w-[45%] md:pr-4 mt-4 md:mt-0">
            <img 
              src="/images/landingpage/about_us.png" 
              alt="關於我們" 
              className="w-full max-w-md mx-auto"
            />
          </div>
          
          {/* 右侧文字区域 */}
          <div className="w-full md:w-[45%] md:pl-6 mt-6 md:mt-0">
            {/* 标题区域移至右侧 */}
            <h2 className="text-3xl font-bold mb-4">智能熱食取餐第一品牌</h2>
            {/* 添加分隔线 */}
            <div className="w-full h-px bg-black mb-4"></div>
            {/* 副标题加大 */}
            <h3 className="text-xl mb-8">浩華企業重新定義企業用餐體驗</h3>
            
            <p className="text-base leading-7 text-gray-600">
            成立於2016年，以智能科技實現「免等待外送・破單調團膳」，用低碳模式打造「高效能・零浪費」的職場餐飲生態。
            </p>

            <p className="text-base leading-7 text-gray-600 pt-4">
            當全台的百大企業普遍為員工提供團膳飲食，我們看見的是高效背後的代價，透過All-in-One智能餐飲服務，我們正在為台灣多家家指標企業每年節省大量的行政工時，並且大幅提升員工用餐滿意度。
            </p>

            <p className="text-base leading-7 text-gray-600 pt-4">
            我們相信良好的用餐體驗能提升員工幸福感，進而帶動企業正向發展。從一頓熱食開始，我們正在改寫企業後勤的永續方程式。
            </p>
          </div>
        </div>

        {/* 合作客戶logo區塊 */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">合作客戶</h2>
            <div className="w-100 h-px bg-black mx-auto mb-4"></div>
          </div>
          
          {/* Logo跑馬燈容器 */}
          <div className="relative overflow-hidden w-full h-40 bg-white">
            {/* 使用兩組相同的logo實現無縫滾動 */}
            <div className="flex absolute animate-marquee whitespace-nowrap">
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/fox.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/ass.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/ing.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/lcfc.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/med.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/win.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/cat.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/sig.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/lil.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/ric.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/vis.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              
              {/* 重複一組logo實現無縫效果 */}
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/fox.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/ass.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/ing.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/lcfc.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/med.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
              <div className="flex items-center justify-center mx-6 min-w-[100px]">
                <img src="/images/logo_cus/win.png" alt="客戶logo" className="h-24 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* 下箭頭符號 */}
        <div className="flex justify-center mb-8">
          <div 
            className="text-black text-6xl cursor-pointer hover:text-gray-600 transition-colors duration-300 font-bold animate-bounce"
            onClick={scrollToServices}
            style={{ textShadow: '0 0 10px rgba(0,0,0,0.1)' }}
          >
            ︾
          </div>
        </div>
      </div>
    )
  }
  
  export default About