'use client';

export default function EmployeeInfo() {
  const announcements = [
    {
      id: 1,
      title: "新品發布會議通知",
      date: "2024-01-15",
      priority: "high",
      content: "將於下週三舉行新品發布會議，請各部門準備相關資料。"
    },
    {
      id: 2,
      title: "員工福利政策更新",
      date: "2024-01-10",
      priority: "medium",
      content: "員工健康保險和休假政策有所調整，詳情請查看人事部公告。"
    },
    {
      id: 3,
      title: "辦公室搬遷計畫",
      date: "2024-01-05",
      priority: "low",
      content: "預計於第二季進行辦公室搬遷，新地址資訊將陸續公布。"
    }
  ];

  const policies = [
    {
      title: "出勤管理",
      icon: "⏰",
      items: ["上班時間：09:00-18:00", "彈性上班時間：08:30-09:30", "午休時間：12:00-13:00"]
    },
    {
      title: "請假制度",
      icon: "📅",
      items: ["年假：依法令規定", "病假：30天/年", "事假：14天/年", "特休假：依年資計算"]
    },
    {
      title: "薪資福利",
      icon: "💰",
      items: ["薪資發放：每月25日", "年終獎金：依公司營運狀況", "員工保險：勞健保+團保", "三節獎金：春節、端午、中秋"]
    },
    {
      title: "教育訓練",
      icon: "📚",
      items: ["新人訓練：入職後一週", "專業培訓：每季舉辦", "語言學習補助：50%費用", "證照考試獎勵：依證照等級"]
    }
  ];

  const contacts = [
    {
      department: "人事部",
      contact: "王小明",
      phone: "02-1234-5678 #101",
      email: "hr@btw.com.tw"
    },
    {
      department: "財務部",
      contact: "李小華",
      phone: "02-1234-5678 #201",
      email: "finance@btw.com.tw"
    },
    {
      department: "資訊部",
      contact: "張小強",
      phone: "02-1234-5678 #301",
      email: "it@btw.com.tw"
    },
    {
      department: "業務部",
      contact: "陳小美",
      phone: "02-1234-5678 #401",
      email: "sales@btw.com.tw"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴 重要';
      case 'medium': return '🟡 普通';
      case 'low': return '🟢 一般';
      default: return '⚪ 未分類';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            👥 員工資訊中心
          </h2>
          <p className="text-lg text-gray-600">
            公司政策、公告事項、聯絡資訊一站式查詢
          </p>
        </div>

        {/* Announcements */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📢</span>
            最新公告
          </h3>
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {announcement.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityText(announcement.priority)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">
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
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📋</span>
            公司政策
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((policy, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2 text-2xl">{policy.icon}</span>
                  {policy.title}
                </h4>
                <ul className="space-y-2">
                  {policy.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-600 flex items-start">
                      <span className="mr-2 text-blue-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Department Contacts */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📞</span>
            部門聯絡方式
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contacts.map((contact, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {contact.department}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{contact.contact}</p>
                  <p>
                    <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className="text-blue-600 hover:text-blue-800">
                      {contact.phone}
                    </a>
                  </p>
                  <p>
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                      {contact.email}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">🔗 快速連結</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="#"
              className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">線上請假系統</div>
            </a>
            <a
              href="#"
              className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">💼</div>
              <div className="font-medium">員工專區</div>
            </a>
            <a
              href="#"
              className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">薪資查詢</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 