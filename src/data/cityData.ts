export interface CityData {
  chinese: string;
  english: string;
  description?: string; // Optional field for extra info
}

// Key matches the COUNTYNAME in public/taiwan.geojson
export const cityData: Record<string, CityData> = {
  '臺北市': {
    chinese: '臺北市',
    english: 'Taipei City',
    description: '聯發科 行善辦公室 (2023/10進駐)<br>聯發科 瑞光辦公室 (2024/10進駐)<br>聯發科 太陽廣場 (2024/11進駐)<br>聯寶電腦 台北總部(2023/09進駐)<br>華邦電子 南港辦公室(2024/09進駐)<br>新唐科技 南港辦公室(2024/09進駐)<br>__________________________<br>總服務人數約 2,000人'
  },
  '新北市': {
    chinese: '新北市',
    english: 'New Taipei City',
    description: '鴻佰科技 土城廠區(2024/08進駐)<br>鴻齡科技 土城廠區(2024/08進駐)<br>鴻運科技 土城廠區(2024/08進駐)<br>__________________________<br>總服務人數約 700人'
  },
  '桃園市': {
    chinese: '桃園市',
    english: 'Taoyuan City',
    description: '世界先進 晶圓三廠(2019/11進駐)<br>__________________________<br>總服務人數約 900人'
  },
  '臺中市': {
    chinese: '臺中市',
    english: 'Taichung City',
    description: '國泰人壽 中港大樓(2024/04進駐)<br>國泰人壽 忠明大樓(2024/04進駐)<br>凱基人壽 市政大樓(2025/12進駐)<br>__________________________<br>總服務人數約 2,000人'
  },
  '臺南市': {
    chinese: '臺南市',
    english: 'Tainan City',
    description: '聯發科 國科會辦公室 (2024/04進駐)<br>臺灣科技新創基地(2024/04進駐)<br>泰吉軒食品 總部(2024/09進駐)<br>中央研究院 南部院區(2024/09進駐)<br>華邦電子 台南辦公室(2024/09進駐)<br>新唐電子 台南辦公室(2024/09進駐)<br>__________________________<br>總服務人數約 1,800人'
  },
  '高雄市': {
    chinese: '高雄市',
    english: 'Kaohsiung City',
    description: '鴻海精密工業(2024/11進駐)<br>鴻佰科技 高雄軟體園區(2024/06進駐)<br>鴻齡科技 高雄軟體園區(2024/06進駐)<br>鴻運科技 高雄軟體園區(2024/06進駐)<br>雲高科技 高雄軟體園區(2024/06進駐)<br>__________________________<br>總服務人數約 600人'
  },
  '基隆市': {
    chinese: '基隆市',
    english: 'Keelung City',
    description: '開發中'
  },
  '新竹市': {
    chinese: '新竹市',
    english: 'Hsinchu City',
    description: '聯發科技 台灣總部(2023/04進駐)<br>聯發科技 S棟(2023/04進駐)<br>世界先進 晶圓二廠(2021/09進駐)<br>世界先進 晶圓五廠(2021/09進駐)<br>__________________________<br>總服務人數約 1,900人'
  },
  '嘉義市': {
    chinese: '嘉義市',
    english: 'Chiayi City',
    description: '開發中'
  },
  '新竹縣': {
    chinese: '新竹縣',
    english: 'Hsinchu County',
    description: '聯發科技 昌益辦公室(2023/04進駐)<br>世界先進 晶圓一廠(2021/09進駐)<br>奕力科技 總部辦公室(2022/10進駐)<br>華邦電子 竹北辦公室(2022/10進駐)<br>新唐科技 竹北辦公室(2022/10進駐)<br>星宸科技 竹北辦公室(2024/03進駐)<br>立錡科技 總公司(2024/03進駐)<br>鴻佰科技 竹北廠區(2024/03進駐)<br>__________________________<br>總服務人數約 1,900人'
  },
  '苗栗縣': {
    chinese: '苗栗縣',
    english: 'Miaoli County',
    description: '開發中'
  },
  '彰化縣': {
    chinese: '彰化縣',
    english: 'Changhua County',
    description: '開發中'
  },
  '南投縣': {
    chinese: '南投縣',
    english: 'Nantou County',
    description: '開發中'
  },
  '雲林縣': {
    chinese: '雲林縣',
    english: 'Yunlin County',
    description: '開發中'
  },
  '嘉義縣': {
    chinese: '嘉義縣',
    english: 'Chiayi County',
    description: '開發中'
  },
  '屏東縣': {
    chinese: '屏東縣',
    english: 'Pingtung County',
    description: '開發中'
  },
  '宜蘭縣': {
    chinese: '宜蘭縣',
    english: 'Yilan County',
    description: '開發中'
  },
  '花蓮縣': {
    chinese: '花蓮縣',
    english: 'Hualien County',
    description: '開發中'
  },
  '臺東縣': {
    chinese: '臺東縣',
    english: 'Taitung County',
    description: '開發中'
  }

};

