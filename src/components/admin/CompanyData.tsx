'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// 定義型別
interface CompanyStat {
  label: string;
  value: string;
  trend: string;
  color: string;
}

interface Partner {
  name: string;
  category: string;
  status: string;
  monthlyOrders: number;
}

interface DesignProgress {
  name: string;
  completed: boolean;
}

interface Region {
  name: string;
  restaurants: number;
  orders: number;
  revenue: string;
  designProgress: DesignProgress[];
}

interface AnnualGoal {
  label: string;
  current: number;
  target: number;
  percentage: number;
  color: string;
}

interface DateInfo {
  section: string;
  date: string;
}

export default function CompanyData() {
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [annualGoals, setAnnualGoals] = useState<AnnualGoal[]>([]);
  const [dates, setDates] = useState<DateInfo[]>([]);
  const [missionContent, setMissionContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 格式化數字顯示（加入千分位分隔符號）
  const formatNumber = (value: string): string => {
    const num = parseInt(value.replace(/[^\d]/g, ''));
    return num.toLocaleString();
  };

  // 解析設計進度字串
  const parseDesignProgress = (progressStr: string): DesignProgress[] => {
    if (!progressStr) return [];
    return progressStr.split('|').map(item => {
      const [name, completed] = item.split(':');
      return { name, completed: completed === 'true' };
    });
  };

  // 獲取特定區塊的日期
  const getSectionDate = (sectionName: string): string => {
    const dateInfo = dates.find(d => d.section === sectionName);
    return dateInfo ? dateInfo.date : '';
  };

  // 載入 CSV 數據
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        // 載入營運績效數據
        const statsResponse = await fetch('/api/company-stats');
        const statsResult = await statsResponse.json();
        if (statsResult.success && statsResult.data) {
          setCompanyStats(statsResult.data);
        }

        // 載入客戶數據
        const clientsResponse = await fetch('/api/partners');
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success && clientsResult.data) {
          const formattedClients = clientsResult.data.map((client: any) => ({
            name: client.name,
            category: client.category,
            status: client.status,
            monthlyOrders: client.monthly_orders
          }));
          setPartners(formattedClients);
        }

        // 載入區域數據
        const regionsResponse = await fetch('/api/regions');
        const regionsResult = await regionsResponse.json();
        if (regionsResult.success && regionsResult.data) {
          const formattedRegions = regionsResult.data.map((region: any) => ({
            name: region.name,
            restaurants: region.restaurants,
            orders: region.orders,
            revenue: region.revenue,
            designProgress: parseDesignProgress(region.design_progress)
          }));
          setRegions(formattedRegions);
        }

        // 載入年度目標數據
        const goalsResponse = await fetch('/api/annual-goals');
        const goalsResult = await goalsResponse.json();
        if (goalsResult.success && goalsResult.data) {
          const formattedGoals = goalsResult.data.map((goal: any) => ({
            label: goal.label,
            current: goal.current_value,
            target: goal.target_value,
            percentage: goal.percentage,
            color: goal.color
          }));
          setAnnualGoals(formattedGoals);
        }

        // 載入日期數據
        const datesResponse = await fetch('/data/csv/dates.csv');
        const datesText = await datesResponse.text();
        const datesData = Papa.parse(datesText, { header: true });
        setDates(datesData.data as DateInfo[]);

        // 載入公司使命 HTML 內容
        const missionResponse = await fetch('/data/html/company-mission.html');
        const missionText = await missionResponse.text();
        setMissionContent(missionText);

        setLoading(false);
      } catch (error) {
        console.error('載入 CSV 數據時發生錯誤:', error);
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">載入數據中...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '運營中';
      case 'pending': return '待審核';
      case 'inactive': return '暫停';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            公司營運狀況
          </h2>
          <p className="text-lg text-gray-600">
            BTW 公司營運數據、合作夥伴及市場分析
          </p>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Mission */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              公司使命
            </h3>
            <div dangerouslySetInnerHTML={{ __html: missionContent }} />
          </div>

          {/* Goals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2025 年度目標
            </h3>
            <div className="space-y-6">
              {annualGoals.map((goal, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{goal.label}</span>
                    <span className="text-sm font-semibold">
                      {goal.current.toLocaleString()}/{goal.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${goal.color} h-2 rounded-full transition-all duration-300`} 
                      style={{ width: `${goal.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <p className="text-sm text-gray-600 mt-2 mb-2 text-right">截至 {getSectionDate('annualGoals')}</p>
            </div>
          </div>
        </div>

        {/* Company Stats */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            2025 綜合營運績效
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {stat.trend} 本月
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2 mb-2 text-right">截至 {getSectionDate('companyStats')}</p>
        </div>
        


        {/* Partners */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 mt-12">
            企業客戶營運績效
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      企業名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      地區
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      月訂單量
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partners.map((partner, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{partner.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(partner.status)}`}>
                          {getStatusText(partner.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {partner.monthlyOrders.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                       </div>
            <p className="text-sm text-gray-600 mt-2 mb-2 text-right">截至 {getSectionDate('partners')}</p>
          </div>

        {/* Regional Data */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            各區域客戶營運狀況
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">{region.name}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">據點數</span>
                    <span className="font-semibold text-gray-900">{region.restaurants} 據點</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月訂單數</span>
                    <span className="font-semibold text-gray-900">{region.orders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月營收</span>
                    <span className="font-semibold text-cyan-600">{region.revenue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">美編進度</span>
                    <div className="flex flex-wrap justify-end">
                      {region.designProgress.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center">
                          <div className={`w-3 h-3 rounded border mr-1 ml-2 flex items-center justify-center ${
                            item.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'bg-gray-100 border-gray-300'
                          }`}>
                            {item.completed && (
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs ${item.completed ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
                  </div>
        <p className="text-sm text-gray-600 mt-2 mb-2 text-right">截至 {getSectionDate('regions')}</p>
        
      </div>
    </div>
  );
} 