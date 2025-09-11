'use client';

import { useState, useEffect } from 'react';

interface Region {
  id: number;
  name: string;
  restaurants: number;
  orders: number;
  revenue: string;
  design_progress: string;
  created_at: string;
  updated_at: string;
}

interface DesignProgress {
  name: string;
  completed: boolean;
}

export default function RegionsManager() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    restaurants: 0,
    orders: 0,
    revenue: '',
    design_progress: ''
  });

  const designOptions = [
    'EDM',
    '菜牌', 
    '廣告機'
  ];

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/regions');
      const result = await response.json();
      
      if (result.success && result.data) {
        setRegions(result.data);
      } else {
        alert('載入區域資料失敗：' + result.message);
      }
    } catch (error) {
      console.error('載入區域資料失敗:', error);
      alert('載入區域資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const parseDesignProgress = (progressStr: string): DesignProgress[] => {
    if (!progressStr) return [];
    return progressStr.split('|').map(item => {
      const [name, completed] = item.split(':');
      return { name, completed: completed === 'true' };
    });
  };

  const formatDesignProgress = (progressArray: { [key: string]: boolean }): string => {
    return designOptions.map(option => 
      `${option}:${progressArray[option] || false}`
    ).join('|');
  };

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.revenue.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch('/api/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('區域資料新增成功！');
        setFormData({ name: '', restaurants: 0, orders: 0, revenue: '', design_progress: '' });
        setShowAddForm(false);
        loadRegions();
      } else {
        alert('新增失敗：' + result.message);
      }
    } catch (error) {
      console.error('新增區域資料失敗:', error);
      alert('新增區域資料失敗');
    }
  };

  const handleEditRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRegion || !formData.name.trim() || !formData.revenue.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch(`/api/regions/${editingRegion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('區域資料更新成功！');
        setEditingRegion(null);
        setFormData({ name: '', restaurants: 0, orders: 0, revenue: '', design_progress: '' });
        loadRegions();
      } else {
        alert('更新失敗：' + result.message);
      }
    } catch (error) {
      console.error('更新區域資料失敗:', error);
      alert('更新區域資料失敗');
    }
  };

  const handleDeleteRegion = async (region: Region) => {
    if (!confirm(`確定要刪除「${region.name}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/regions/${region.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('區域資料刪除成功！');
        loadRegions();
      } else {
        alert('刪除失敗：' + result.message);
      }
    } catch (error) {
      console.error('刪除區域資料失敗:', error);
      alert('刪除區域資料失敗');
    }
  };

  const startEdit = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      restaurants: region.restaurants,
      orders: region.orders,
      revenue: region.revenue,
      design_progress: region.design_progress
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingRegion(null);
    setFormData({ name: '', restaurants: 0, orders: 0, revenue: '', design_progress: '' });
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

  const updateDesignProgress = (option: string, completed: boolean) => {
    const current = parseDesignProgress(formData.design_progress);
    const updated = current.map(item => 
      item.name === option ? { ...item, completed } : item
    );
    
    if (!current.find(item => item.name === option)) {
      updated.push({ name: option, completed });
    }
    
    const progressObj: { [key: string]: boolean } = {};
    designOptions.forEach(opt => {
      const found = updated.find(item => item.name === opt);
      progressObj[opt] = found ? found.completed : false;
    });
    
    setFormData({
      ...formData,
      design_progress: formatDesignProgress(progressObj)
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">區域資料管理</h2>
          <p className="text-gray-600 mt-1">管理各區域客戶營運狀況資料</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingRegion(null);
            setFormData({ name: '', restaurants: 0, orders: 0, revenue: '', design_progress: '' });
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增區域
        </button>
      </div>

      {(showAddForm || editingRegion) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRegion ? '編輯區域資料' : '新增區域資料'}
          </h3>
          <form onSubmit={editingRegion ? handleEditRegion : handleAddRegion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  區域名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：台北"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  據點數 *
                </label>
                <input
                  type="number"
                  value={formData.restaurants}
                  onChange={(e) => setFormData({ ...formData, restaurants: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月訂單數 *
                </label>
                <input
                  type="number"
                  value={formData.orders}
                  onChange={(e) => setFormData({ ...formData, orders: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月營收 *
                </label>
                <input
                  type="text"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：NT$ 12,500,000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                美編項目
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {designOptions.map((option) => {
                  const currentProgress = parseDesignProgress(formData.design_progress);
                  const isCompleted = currentProgress.find(item => item.name === option)?.completed || false;
                  
                  return (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => updateDesignProgress(option, e.target.checked)}
                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  );
                })}
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
                {editingRegion ? '更新區域' : '新增區域'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {regions.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-lg">尚未設定任何區域資料</p>
            <p className="text-sm">點擊「新增區域」按鈕開始設定區域營運資料</p>
          </div>
        ) : (
          regions.map((region) => {
            const designProgress = parseDesignProgress(region.design_progress);
            
            return (
              <div key={region.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{region.name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(region)}
                      className="p-1 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                      title="編輯"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRegion(region)}
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="刪除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
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
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-600 text-sm block mb-2">美編製作進度</span>
                    <div className="grid grid-cols-2 gap-2">
                      {designProgress.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center">
                          <div className={`w-3 h-3 rounded border mr-2 flex items-center justify-center ${
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
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      建立時間: {formatDate(region.created_at)}
                      {region.updated_at !== region.created_at && (
                        <>
                          <br />更新時間: {formatDate(region.updated_at)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
