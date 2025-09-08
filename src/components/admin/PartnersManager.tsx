'use client';

import { useState, useEffect } from 'react';

// 定義型別
interface Partner {
  id: number;
  name: string;
  category: string;
  status: string;
  monthly_orders: number;
  created_at: string;
  updated_at: string;
}

export default function PartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'active',
    monthly_orders: 0
  });

  const statusOptions = [
    { value: 'active', label: '運營中', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: '待審核', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inactive', label: '暫停', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners');
      const result = await response.json();
      
      if (result.success && result.data) {
        setPartners(result.data);
      } else {
        alert('載入企業客戶失敗：' + result.message);
      }
    } catch (error) {
      console.error('載入企業客戶失敗:', error);
      alert('載入企業客戶失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('企業客戶新增成功！');
        setFormData({ name: '', category: '', status: 'active', monthly_orders: 0 });
        setShowAddForm(false);
        loadPartners();
      } else {
        alert('新增失敗：' + result.message);
      }
    } catch (error) {
      console.error('新增企業客戶失敗:', error);
      alert('新增企業客戶失敗');
    }
  };

  const handleEditPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPartner || !formData.name.trim() || !formData.category.trim()) {
      alert('請填寫完整資料');
      return;
    }

    try {
      const response = await fetch(`/api/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('企業客戶更新成功！');
        setEditingPartner(null);
        setFormData({ name: '', category: '', status: 'active', monthly_orders: 0 });
        loadPartners();
      } else {
        alert('更新失敗：' + result.message);
      }
    } catch (error) {
      console.error('更新企業客戶失敗:', error);
      alert('更新企業客戶失敗');
    }
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm(`確定要刪除「${partner.name}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('企業客戶刪除成功！');
        loadPartners();
      } else {
        alert('刪除失敗：' + result.message);
      }
    } catch (error) {
      console.error('刪除企業客戶失敗:', error);
      alert('刪除企業客戶失敗');
    }
  };

  const startEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      category: partner.category,
      status: partner.status,
      monthly_orders: partner.monthly_orders
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingPartner(null);
    setFormData({ name: '', category: '', status: 'active', monthly_orders: 0 });
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

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : '未知';
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
          <h2 className="text-2xl font-bold text-gray-900">企業客戶管理</h2>
          <p className="text-gray-600 mt-1">管理企業客戶營運績效資料</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingPartner(null);
            setFormData({ name: '', category: '', status: 'active', monthly_orders: 0 });
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增客戶
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingPartner) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingPartner ? '編輯企業客戶' : '新增企業客戶'}
          </h3>
          <form onSubmit={editingPartner ? handleEditPartner : handleAddPartner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：星巴克咖啡"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地區 *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：台北市"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  狀態
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月訂單量 *
                </label>
                <input
                  type="number"
                  value={formData.monthly_orders}
                  onChange={(e) => setFormData({ ...formData, monthly_orders: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                  required
                />
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
                {editingPartner ? '更新客戶' : '新增客戶'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {partners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg">尚未設定任何企業客戶</p>
            <p className="text-sm">點擊「新增客戶」按鈕開始設定企業客戶資料</p>
          </div>
        ) : (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    建立時間
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
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
                      {partner.monthly_orders.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(partner.created_at)}
                      {partner.updated_at !== partner.created_at && (
                        <div>更新: {formatDate(partner.updated_at)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(partner)}
                          className="text-cyan-600 hover:text-cyan-900 transition-colors"
                          title="編輯"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="刪除"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
