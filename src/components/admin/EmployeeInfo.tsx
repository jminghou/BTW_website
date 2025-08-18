'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// 定義型別
interface Announcement {
  id: number;
  title: string;
  date: string;
  priority: string;
  content: string;
}

export default function EmployeeInfo() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入公告數據
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetch('/data/csv/announcements.csv');
        const text = await response.text();
        const data = Papa.parse(text, { header: true });
        const formattedAnnouncements = data.data.map((announcement: any) => ({
          ...announcement,
          id: parseInt(announcement.id)
        }));
        setAnnouncements(formattedAnnouncements);
        setLoading(false);
      } catch (error) {
        console.error('載入公告數據時發生錯誤:', error);
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const policies = [
    {
      title: "出勤管理",
      items: ["上班時間：09:00-18:00", "彈性上班時間：08:30-09:30", "午休時間：1 小時，視實際工作狀況自行調配"]
    },
    {
      title: "請假制度",
      items: ["年假(特休)：依勞基法年資級距給假", "病假：30天/年（非因公受傷或生病）", "事假：14天/年"]
    },
    {
      title: "系統成本修改時程規定",
      items: ["店家10號「前」通知價格異動則次月生效", "店家10號「後」通知價格異動則次次月生效", "新售價及需下架品項需待次月5號會計鎖帳後採購再更新"]
    },
    {
      title: "系統建檔時程規定",
      items: ["可以開始排菜單的日期，從採購收到合約的下個月開始", "營運/業務需在排菜當月10號「前」提交品項及價格", "營運/業務需在排菜當月15號「前」提供餐點圖相片或實體餐點"]
    },
    {
      title: "店家餐點圖時程規定",
      items: ["店家有在官網、外送平台發佈餐點圖者不需提供相片", "在排菜單當月20號「前」仍缺餐點圖時將使用便當寶寶圖做替代", "店家後續補相片後請通知美編更新，並修改管理表狀態"]
    },
    {
      title: "排菜單(EDM、廣告機、菜牌)時程規定",
      items: ["各據點營運排菜單截止底限為當月25號(三廠除外)", "聯發科內部排菜單截底限為當月20號", "提早完成菜單確認者請提早通知美編製作"]
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
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-600">載入公告中...</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Policies */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            公司政策與重要工作時程
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