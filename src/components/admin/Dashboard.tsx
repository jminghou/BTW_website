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

  const StatCard = ({ title, value, bgColor }: {
    title: string;
    value: number;
    bgColor: string;
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? '...' : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${bgColor}`}></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            儀表板
          </h1>
          <p className="text-lg text-gray-600">
            BTW 內部管理系統 - 重要數據和營運狀況總覽
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
            bgColor="bg-cyan-500"
          />
          <StatCard
            title="今日新增"
            value={stats.todayContacts}
            bgColor="bg-gray-400"
          />
          <StatCard
            title="本週累計"
            value={stats.weeklyContacts}
            bgColor="bg-gray-500"
          />
          <StatCard
            title="本月累計"
            value={stats.monthlyContacts}
            bgColor="bg-gray-600"
          />
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              系統狀態
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">資料庫連線</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-900 font-medium">正常</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">網站狀態</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-900 font-medium">運行中</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">最後備份</span>
                <span className="text-gray-900 font-medium">2小時前</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              最近活動
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></div>
                新聯絡表單提交 - 5分鐘前
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                資料庫備份完成 - 2小時前
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                系統更新部署 - 1天前
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                安全性掃描完成 - 2天前
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">BTW 內部管理系統</h2>
            <p className="text-lg mb-6 opacity-90">
              專為內部員工設計的管理平台，提供聯絡表單管理、客戶資料查詢、公司資訊查看等功能
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <span className="text-sm font-medium">安全認證</span>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <span className="text-sm font-medium">即時同步</span>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <span className="text-sm font-medium">全天候服務</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 