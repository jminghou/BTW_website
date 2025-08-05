'use client';

export default function EmployeeInfo() {
  const announcements = [
    {
      id: 1,
      title: "酷澎機台入駐",
      date: "2024-01-15",
      priority: "high",
      content: "預計於8月下旬入駐，請各部門準備相關資料。"
    },
    {
      id: 2,
      title: "奕力機台入駐",
      date: "2024-01-10",
      priority: "medium",
      content: "預計於8月下旬入駐，請各部門準備相關資料。"
    },
    {
      id: 3,
      title: "辦公室搬遷計畫",
      date: "2024-01-05",
      priority: "low",
      content: "預計於第四季進行辦公室搬遷，新地址資訊將陸續公布。"
    }
  ];

  const policies = [
    {
      title: "出勤管理",
      items: ["上班時間：09:00-18:00", "彈性上班時間：08:30-09:30", "午休時間：12:00-13:00"]
    },
    {
      title: "請假制度",
      items: ["年假：依法令規定", "病假：30天/年", "事假：14天/年", "特休假：依年資計算"]
    },
    {
      title: "系統成本修改注意事項",
      items: ["店家10號「前」通知價格異動則次月生效", "店家10號「後」通知價格異動則次次月生效", "營運請店家提供新菜單並請店家登入系統更新店內價", "新售價及需下架品項需待次月5號會計鎖帳後採購再更新"]
    },
    {
      title: "菜單與餐點圖製作要點",
      items: ["店家10號「前」通知價格異動則次月生效", "店家10號「後」通知價格異動則次次月生效", "營運請店家提供新菜單並請店家登入系統更新店內價", "新售價及需下架品項需待次月5號會計鎖帳後採購再更新"]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '重要';
      case 'medium': return '普通';
      case 'low': return '一般';
      default: return '未分類';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
            公司重要訊息
          </h2>
          <p className="text-lg text-gray-600">
            公司政策、公告事項
          </p>
        </div>

        {/* Announcements */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            最新公告
          </h3>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h4>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityText(announcement.priority)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {announcement.content}
                    </p>
                    <p className="text-sm text-gray-500">
                      發布日期：{announcement.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            公司政策
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((policy, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  {policy.title}
                </h4>
                <ul className="space-y-3">
                  {policy.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-600 flex items-start">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">更新資料</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="#"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-center transition-colors group"
            >
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-400 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-medium">更新最新公告</div>
            </a>
            <a
              href="#"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-center transition-colors group"
            >
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-400 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="font-medium">更新公司營運資料</div>
            </a>
            <a
              href="#"
              className="bg-white/10 hover:bg-white/20 rounded-lg p-6 text-center transition-colors group"
            >
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-400 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="font-medium">更新區域營運資料</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 