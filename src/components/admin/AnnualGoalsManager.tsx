'use client';

import { useState, useEffect } from 'react';

// 定義型別
interface AnnualGoal {
  id: number;
  label: string;
  current_value: number;
  target_value: number;
  color: string;
  percentage: number;
  created_at: string;
  updated_at: string;
}

interface NewGoalForm {
  label: string;
  current_value: number;
  target_value: number;
  color: string;
}

interface EditGoalForm extends NewGoalForm {
  id: number;
}

export default function AnnualGoalsManager() {
  const [goals, setGoals] = useState<AnnualGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | null>(null);
  const [formData, setFormData] = useState<NewGoalForm>({
    label: '',
    current_value: 0,
    target_value: 0,
    color: 'bg-cyan-500'
  });

  const colorOptions = [
    { value: 'bg-cyan-500', label: '青色', preview: 'bg-cyan-500' },
    { value: 'bg-blue-500', label: '藍色', preview: 'bg-blue-500' },
    { value: 'bg-green-500', label: '綠色', preview: 'bg-green-500' },
    { value: 'bg-yellow-500', label: '黃色', preview: 'bg-yellow-500' },
    { value: 'bg-red-500', label: '紅色', preview: 'bg-red-500' },
    { value: 'bg-purple-500', label: '紫色', preview: 'bg-purple-500' },
    { value: 'bg-indigo-500', label: '靛色', preview: 'bg-indigo-500' },
    { value: 'bg-pink-500', label: '粉色', preview: 'bg-pink-500' },
    { value: 'bg-gray-500', label: '灰色', preview: 'bg-gray-500' },
    { value: 'bg-gray-600', label: '深灰', preview: 'bg-gray-600' }
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/annual-goals');
      const result = await response.json();
      
      if (result.success && result.data) {
        setGoals(result.data);
      } else {
        alert('載入年度目標失敗：' + result.message);
      }
    } catch (error) {
      console.error('載入年度目標失敗:', error);
      alert('載入年度目標失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim() || formData.target_value <= 0) {
      alert('請填寫完整資料，目標值必須大於0');
      return;
    }

    try {
      const response = await fetch('/api/annual-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('年度目標新增成功！');
        setFormData({
          label: '',
          current_value: 0,
          target_value: 0,
          color: 'bg-cyan-500'
        });
        setShowAddForm(false);
        loadGoals();
      } else {
        alert('新增失敗：' + result.message);
      }
    } catch (error) {
      console.error('新增年度目標失敗:', error);
      alert('新增年度目標失敗');
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGoal || !formData.label.trim() || formData.target_value <= 0) {
      alert('請填寫完整資料，目標值必須大於0');
      return;
    }

    try {
      const response = await fetch(`/api/annual-goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('年度目標更新成功！');
        setEditingGoal(null);
        setFormData({
          label: '',
          current_value: 0,
          target_value: 0,
          color: 'bg-cyan-500'
        });
        loadGoals();
      } else {
        alert('更新失敗：' + result.message);
      }
    } catch (error) {
      console.error('更新年度目標失敗:', error);
      alert('更新年度目標失敗');
    }
  };

  const handleDeleteGoal = async (goal: AnnualGoal) => {
    if (!confirm(`確定要刪除「${goal.label}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/annual-goals/${goal.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('年度目標刪除成功！');
        loadGoals();
      } else {
        alert('刪除失敗：' + result.message);
      }
    } catch (error) {
      console.error('刪除年度目標失敗:', error);
      alert('刪除年度目標失敗');
    }
  };

  const startEdit = (goal: AnnualGoal) => {
    setEditingGoal(goal);
    setFormData({
      label: goal.label,
      current_value: goal.current_value,
      target_value: goal.target_value,
      color: goal.color
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setFormData({
      label: '',
      current_value: 0,
      target_value: 0,
      color: 'bg-cyan-500'
    });
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
          <h2 className="text-2xl font-bold text-gray-900">年度目標管理</h2>
          <p className="text-gray-600 mt-1">管理公司年度目標設定與進度追蹤</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingGoal(null);
            setFormData({
              label: '',
              current_value: 0,
              target_value: 0,
              color: 'bg-cyan-500'
            });
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增目標
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingGoal) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingGoal ? '編輯年度目標' : '新增年度目標'}
          </h3>
          <form onSubmit={editingGoal ? handleEditGoal : handleAddGoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標名稱 *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="例如：今年營收目標"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  進度條顏色
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  當前值 *
                </label>
                <input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標值 *
                </label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="1"
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
                {editingGoal ? '更新目標' : '新增目標'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {goals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-lg">尚未設定任何年度目標</p>
            <p className="text-sm">點擊「新增目標」按鈕開始設定您的年度目標</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {goals.map((goal) => (
              <div key={goal.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{goal.label}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">進度</span>
                      <span className="text-sm font-semibold">
                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()} ({goal.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${goal.color} h-3 rounded-full transition-all duration-300`} 
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      建立時間: {formatDate(goal.created_at)}
                      {goal.updated_at !== goal.created_at && ` • 更新時間: ${formatDate(goal.updated_at)}`}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(goal)}
                      className="p-2 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
