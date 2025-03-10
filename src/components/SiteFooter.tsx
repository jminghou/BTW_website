import Image from 'next/image'

const SiteFooter = () => {
  return (
    <footer className="relative bg-cover bg-center bg-no-repeat py-12" 
           style={{ backgroundImage: "url('/images/landingpage/banner_food.jpg')" }}>
      {/* 黑色遮罩层 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}></div>
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="flex flex-col md:flex-row">
          {/* Logo 部分 */}
          <div className="mb-8 md:mb-0 md:w-1/3">
            <Image 
              src="/svg/btw_logo_w.svg" 
              alt="BTW Logo" 
              width={260} 
              height={60}
              className="mb-4"
            />
          </div>
          
          {/* 公司信息部分 */}
          <div className="md:w-2/3">
            <div className="text-white mb-2 md:text-right">
              <h3 className="text-xl font-bold mb-2">浩華企業股份有限公司</h3>
              <p className="text-gray-300 mb-2">HAOHUA Tech. Co., LTD</p>
              <div className="border-b border-white w-full mb-3"></div>
              <div className="mt-4 space-y-1">
                <p>統編：52414831</p>
                <p>電話：(02)2522-1167</p>
                <p>地址：臺北市大同區太原路154之1號3樓</p>
                <p>3 F., No. 154-1, Taiyuan Rd., Datong Dist., Taipei City 103020, Taiwan (R.O.C.)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 版权声明 */}
        <div className="mt-2 pt-1 text-right text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} HAOHUA Tech. Co., LTD. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter 