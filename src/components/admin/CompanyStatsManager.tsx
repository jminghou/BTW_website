'use client';

import { useState, useEffect } from 'react';

// 定義型別
interface CompanyStat {
  id: number;
  label: string;
  value: string;
  trend: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export default function CompanyStatsManager() {
  const [stats, setStats] = useState<CompanyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStat, setEditingStat] = useState<CompanyStat | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    trend: '',
    color: 'bg-green-500'
  });

  const colorOptions = [
    { value: 'bg-green-500', label: '綠色', preview: 'bg-green-500' },
    { value: 'bg-blue-500', label: '藍色', preview: 'bg-blue-500' },
    { value: 'bg-cyan-500', label: '青色', preview: 'bg-cyan-500' },
    { value: 'bg-yellow-500', label: '黃色', preview: 'bg-yellow-500' },
    { value: 'bg-red-500', label: '紅色', preview: 'bg-red-500' },
    { value: 'bg-purple-500', label: '紫色', preview: 'bg-purple-500' }
  ];

  // 載入數據
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company-stats');
      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        alert('載入公司統計失敗：' + result.message);
      }
    } catch (error) {
      console.error('載入公司統計失敗:', error);
      alert('載入公司統計失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.value.trim() || !formData.trend.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch('/api/company-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('統計項目新增成功！');
        setFormData({ label: '', value: '', trend: '', color: 'bg-green-500' });
        setShowAddForm(false);
        loadStats();
      } else {
        alert('新增失敗：' + result.message);
      }
    } catch (error) {
      console.error('新增統計項目失敗:', error);
      alert('新增統計項目失敗');
    }
  };

  const handleEditStat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStat || !formData.label.trim() || !formData.value.trim() || !formData.trend.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch(`/api/company-stats/${editingStat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('統計項目更新成功！');
        setEditingStat(null);
        setFormData({ label: '', value: '', trend: '', color: 'bg-green-500' });
        loadStats();
      } else {
        alert('更新失敗：' + result.message);
      }
    } catch (error) {
      console.error('更新統計項目失敗:', error);
      alert('更新統計項目失敗');
    }
  };

  const handleDeleteStat = async (stat: CompanyStat) => {
    if (!confirm(`確定要刪除「${stat.label}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/company-stats/${stat.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('統計項目刪除成功！');
        loadStats();
      } else {
        alert('刪除失敗：' + result.message);
      }
    } catch (error) {
      console.error('刪除統計項目失敗:', error);
      alert('刪除統計項目失敗');
    }
  };

  const startEdit = (stat: CompanyStat) => {
    setEditingStat(stat);
    setFormData({
      label: stat.label,
      value: stat.value,
      trend: stat.trend,
      color: stat.color
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingStat(null);
    setFormData({ label: '', value: '', trend: '', color: 'bg-green-500' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">公司統計管理</h2>
          <p className="text-gray-600 mt-1">管理公司營運統計數據</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingStat(null);
            setFormData({ label: '', value: '', trend: '', color: 'bg-green-500' });
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增統計
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingStat) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingStat ? '編輯統計項目' : '新增統計項目'}
          </h3>
          <form onSubmit={editingStat ? handleEditStat : handleAddStat} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  統計項目名稱 *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：總營業額"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  數值 *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：85,200,000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  趨勢 *
                </label>
                <input
                  type="text"
                  value={formData.trend}
                  onChange={(e) => setFormData({ ...formData, trend: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：+12%"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顏色
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  cancelEdit();
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                {editingStat ? '更新統計' : '新增統計'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-green-600 font-medium">
                  {stat.trend} 本月
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              建立時間: {formatDate(stat.created_at)}
              {stat.updated_at !== stat.created_at && ` • 更新時間: ${formatDate(stat.updated_at)}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(stat)}
                className="flex-1 p-2 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors text-sm"
                title="編輯"
              >
                編輯
              </button>
              <button
                onClick={() => handleDeleteStat(stat)}
                className="flex-1 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                title="刪除"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg">尚未設定任何統計項目</p>
          <p className="text-sm">點擊「新增統計」按鈕開始設定統計數據</p>
        </div>
      )}
    </div>
  );
}
