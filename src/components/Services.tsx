'use client'
import Card from './cards/ui_cards';
import hotFoodIcon from '../../public/images/services/icon-1.svg';
import lunchBoxIcon from '../../public/images/services/icon-2.svg';
import vendingIcon from '../../public/images/services/icon-4.svg';
import Image from 'next/image';

const Services = () => {
  const services = [
    {
      title: "智能熱食取餐機",
      description: "我們提供每日多樣的餐點選擇，智能熱食機避免餐點暴露在外，65度保溫技術確保餐點品質，清晰的餐點資訊讓取餐過程快速有效率，節能設計、無紙化操作實踐企業ESG永續理念。",
      icon: (
        <Image
          src={hotFoodIcon}
          alt="智能熱食取餐機"
          width={100}
          height={100}
        />
      ),
      link: "#ser_machine"
    },
    {
      title: "辦公室團購便當",
      description: "我們提供每日多樣的餐點選擇，集中配送更能有效降低企業用餐成本，完整的線上訂餐系統實現無紙化操作，減少碳足跡、無紙化流程實踐企業節能減碳理念。",
      icon: (
        <Image
          src={lunchBoxIcon}
          alt="辦公室團購便當"
          width={100}
          height={100}
        />
      ),
      link: "#ser_office"
    },
    {
      title: "廣告版位投放",
      description: "精準觸及科技大廠高質量受眾。每日用餐時段，您的品牌將直接展現在企業員工面前，創造高頻曝光機會。結合餐飲場景的創新廣告形式，為品牌帶來精準且具影響力的曝光效果。",
      icon: (
        <Image
          src={vendingIcon}
          alt="貨道機與冷櫃機"
          width={100}
          height={100}
        />
      ),
      link: "#ser_ad"
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center mb-12">企業服務</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Card 
            key={index}
            href={service.link}
            icon={service.icon}
            title={service.title}
            description={service.description}
            actionText="了解更多"
          />
        ))}
      </div>
    </div>
  );
}

export default Services;