'use client'
import Card from './cards/sl_cards';
import hotFoodIcon from '../../public/images/services/icon-1.svg';
import lunchBoxIcon from '../../public/images/services/icon-2.svg';
import vendingIcon from '../../public/images/services/icon-3.svg';
import Image from 'next/image';

const Services = () => {
  const services = [
    {
      title: "智能熱食取餐機",
      description: "●避免餐點暴露在外 ●智能保溫技術確保餐點品質 ●清晰餐點資訊取餐過程快速有效率 ●節能設計無紙化操作 ●實踐企業ESG永續理念",
      icon: (
        <Image
          src={hotFoodIcon}
          alt="智能熱食取餐機"
          width={100}
          height={100}
        />
      ),
      link: "#"
    },
    {
      title: "辦公室團購便當",
      description: "●提供每日豐富多元的餐點選擇 ●完整的線上訂餐系統實現無紙化操作 ●集中配送更能有效降低企業用餐成本",
      icon: (
        <Image
          src={lunchBoxIcon}
          alt="辦公室團購便當"
          width={100}
          height={100}
        />
      ),
      link: "#"
    },
    {
      title: "貨道機與冷櫃機",
      description: "●滿足企業員工零食飲料需求 ●多樣化商品選擇 ●即時補貨管理 ●提升員工工作生活品質",
      icon: (
        <Image
          src={vendingIcon}
          alt="貨道機與冷櫃機"
          width={100}
          height={100}
        />
      ),
      link: "#"
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center mb-12">企業服務</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
        {services.map((service, index) => (
          <div key={index} className="w-full flex justify-center">
            <Card href={service.link}>
              <div className="icon">
                {service.icon}
              </div>
              <strong>{service.title}</strong>
              <div className="card__body">
                {service.description}
              </div>
              <span>了解更多</span>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;