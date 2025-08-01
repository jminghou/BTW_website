'use client';

export default function CompanyData() {
  const companyStats = [
    { label: "總營業額", value: "NT$ 15,280,000", trend: "+12.5%", color: "bg-cyan-500" },
    { label: "活躍合作餐廳", value: "127", trend: "+8%", color: "bg-gray-500" },
    { label: "月活躍用戶", value: "34,562", trend: "+15.2%", color: "bg-gray-600" },
    { label: "平均滿意度", value: "4.8/5.0", trend: "+0.3", color: "bg-gray-700" }
  ];

  const partners = [
    { name: "台北101餐廳", category: "高級餐飲", status: "active", monthlyOrders: 1250 },
    { name: "鼎泰豐", category: "中式料理", status: "active", monthlyOrders: 2100 },
    { name: "星巴克", category: "咖啡飲品", status: "active", monthlyOrders: 3800 },
    { name: "麥當勞", category: "速食", status: "active", monthlyOrders: 4500 },
    { name: "必勝客", category: "披薩", status: "pending", monthlyOrders: 800 },
    { name: "肯德基", category: "速食", status: "active", monthlyOrders: 2200 }
  ];

  const regions = [
    { name: "台北市", restaurants: 45, orders: 12500, revenue: "NT$ 6,200,000" },
    { name: "新北市", restaurants: 32, orders: 8900, revenue: "NT$ 4,100,000" },
    { name: "桃園市", restaurants: 25, orders: 6800, revenue: "NT$ 2,800,000" },
    { name: "台中市", restaurants: 18, orders: 5200, revenue: "NT$ 1,900,000" },
    { name: "高雄市", restaurants: 7, orders: 2100, revenue: "NT$ 280,000" }
  ];

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
            公司營運資料
          </h2>
          <p className="text-lg text-gray-600">
            BTW 公司營運數據、合作夥伴及市場分析
          </p>
        </div>

        {/* Company Stats */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            營運績效
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {stat.trend} 較上月
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            合作夥伴
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      餐廳名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      類別
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
        </div>

        {/* Regional Data */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            區域分佈
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">{region.name}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">合作餐廳</span>
                    <span className="font-semibold text-gray-900">{region.restaurants} 家</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月訂單數</span>
                    <span className="font-semibold text-gray-900">{region.orders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月營收</span>
                    <span className="font-semibold text-cyan-600">{region.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mission */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              公司使命
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              BTW 致力於成為台灣領先的餐飲科技平台，透過創新的技術解決方案，
              連接餐廳與消費者，提供便利、高效的用餐體驗，推動餐飲產業的數位轉型。
            </p>
            <div className="space-y-3">
              <div className="flex items-start text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>創新驅動：持續推出前瞻性技術解決方案</span>
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>合作共贏：與合作夥伴建立長期互信關係</span>
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>卓越品質：提供優質可靠的服務體驗</span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              年度目標
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">合作餐廳數量</span>
                  <span className="text-sm font-semibold">127/150</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">月活躍用戶</span>
                  <span className="text-sm font-semibold">34,562/50,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full transition-all duration-300" style={{ width: '69%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">年營收目標</span>
                  <span className="text-sm font-semibold">63%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-600 h-2 rounded-full transition-all duration-300" style={{ width: '63%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 