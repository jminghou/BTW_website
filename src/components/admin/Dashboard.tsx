'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalContacts: number;
  todayContacts: number;
  weeklyContacts: number;
  monthlyContacts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    todayContacts: 0,
    weeklyContacts: 0,
    monthlyContacts: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/contacts');
      const result = await response.json();
      
      if (result.success && result.data) {
        const contacts = result.data;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayContacts = contacts.filter((contact: any) => 
          new Date(contact.created_at) >= today
        ).length;

        const weeklyContacts = contacts.filter((contact: any) => 
          new Date(contact.created_at) >= weekAgo
        ).length;

        const monthlyContacts = contacts.filter((contact: any) => 
          new Date(contact.created_at) >= monthAgo
        ).length;

        setStats({
          totalContacts: contacts.length,
          todayContacts,
          weeklyContacts,
          monthlyContacts
        });
      }
    } catch (error) {
      console.error('載入統計資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, bgColor, textColor }: {
    title: string;
    value: number;
    icon: string;
    bgColor: string;
    textColor: string;
  }) => (
    <div className={`${bgColor} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className={`text-sm font-medium ${textColor} truncate`}>
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className={`text-2xl font-semibold ${textColor}`}>
                {isLoading ? '...' : value}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 內部員工儀表板
          </h1>
          <p className="text-xl text-gray-600">
            歡迎來到 BTW 內部管理系統，查看重要數據和營運狀況
          </p>
          <div className="mt-4 text-sm text-gray-500">
            最後更新時間：{new Date().toLocaleString('zh-TW')}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="總聯絡數"
            value={stats.totalContacts}
            icon="📈"
            bgColor="bg-blue-100"
            textColor="text-blue-800"
          />
          <StatCard
            title="今日新增"
            value={stats.todayContacts}
            icon="📅"
            bgColor="bg-green-100"
            textColor="text-green-800"
          />
          <StatCard
            title="本週累計"
            value={stats.weeklyContacts}
            icon="📊"
            bgColor="bg-purple-100"
            textColor="text-purple-800"
          />
          <StatCard
            title="本月累計"
            value={stats.monthlyContacts}
            icon="📆"
            bgColor="bg-orange-100"
            textColor="text-orange-800"
          />
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              系統狀態
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">資料庫連線</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">網站狀態</span>
                <span className="text-green-600 font-medium">運行中</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">最後備份</span>
                <span className="text-gray-600 font-medium">2小時前</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🕒</span>
              最近活動
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • 新聯絡表單提交 - 5分鐘前
              </div>
              <div className="text-sm text-gray-600">
                • 資料庫備份完成 - 2小時前
              </div>
              <div className="text-sm text-gray-600">
                • 系統更新部署 - 1天前
              </div>
              <div className="text-sm text-gray-600">
                • 安全性掃描完成 - 2天前
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">歡迎使用 BTW 內部管理系統</h2>
          <p className="text-lg opacity-90 mb-6">
            這裡是專為 BTW 內部員工設計的管理平台，您可以查看聯絡表單、管理客戶資料、了解公司最新資訊。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">安全連線</span>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">即時資料</span>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">24/7 支援</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 