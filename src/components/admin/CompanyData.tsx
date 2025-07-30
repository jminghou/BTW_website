'use client';

export default function CompanyData() {
  const companyStats = [
    { label: "總營業額", value: "NT$ 15,280,000", icon: "💰", trend: "+12.5%" },
    { label: "活躍合作餐廳", value: "127", icon: "🏪", trend: "+8%" },
    { label: "月活躍用戶", value: "34,562", icon: "👥", trend: "+15.2%" },
    { label: "平均滿意度", value: "4.8/5.0", icon: "⭐", trend: "+0.3" }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🏢 公司營運資料
          </h2>
          <p className="text-lg text-gray-600">
            BTW 公司營運數據、合作夥伴及市場分析
          </p>
        </div>

        {/* Company Stats */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            營運績效
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {stat.trend} 較上月
                    </p>
                  </div>
                  <div className="text-4xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🤝</span>
            合作夥伴
          </h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{partner.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(partner.status)}`}>
                          {getStatusText(partner.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🗺️</span>
            區域分佈
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{region.name}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">合作餐廳</span>
                    <span className="font-medium">{region.restaurants} 家</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">月訂單數</span>
                    <span className="font-medium">{region.orders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">月營收</span>
                    <span className="font-medium text-green-600">{region.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              公司使命
            </h3>
            <p className="text-gray-600 leading-relaxed">
              BTW 致力於成為台灣領先的餐飲科技平台，透過創新的技術解決方案，
              連接餐廳與消費者，提供便利、高效的用餐體驗，推動餐飲產業的數位轉型。
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🚀</span>
                創新驅動：持續推出前瞻性技術解決方案
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🤝</span>
                合作共贏：與合作夥伴建立長期互信關係
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">💎</span>
                卓越品質：提供優質可靠的服務體驗
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              年度目標
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">合作餐廳數量</span>
                  <span className="text-sm font-medium">127/150</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">月活躍用戶</span>
                  <span className="text-sm font-medium">34,562/50,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '69%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">年營收目標</span>
                  <span className="text-sm font-medium">63%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '63%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 