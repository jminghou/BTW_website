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
      description: "智能熱食取餐機服務...",
      icon: (
        <Image
          src={hotFoodIcon}
          alt="智能熱食取餐機"
          width={100}
          height={100}
        />
      )
    },
    {
      title: "辦公室團購便當",
      description: "辦公室團購便當服務...",
      icon: (
        <Image
          src={lunchBoxIcon}
          alt="辦公室團購便當"
          width={100}
          height={100}
        />
      )
    },
    {
      title: "貨道機與冷櫃機",
      description: "自動貨道機與冷櫃飲料機服務...",
      icon: (
        <Image
          src={vendingIcon}
          alt="貨道機與冷櫃機"
          width={100}
          height={100}
        />
      )
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-center mb-12">企業服務</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
        {services.map((service, index) => (
          <div key={index} className="w-full flex justify-center">
            <Card>
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