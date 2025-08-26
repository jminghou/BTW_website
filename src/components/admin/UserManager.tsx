'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface UserForm {
  username: string;
  password: string;
  display_name: string;
  email: string;
  role: string;
}

interface EditUserForm {
  display_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState<number | null>(null);

  // 新增用戶表單
  const [newUserForm, setNewUserForm] = useState<UserForm>({
    username: '',
    password: '',
    display_name: '',
    email: '',
    role: 'admin'
  });

  // 編輯用戶表單
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    display_name: '',
    email: '',
    role: 'admin',
    is_active: true
  });

  // 密碼更改表單
  const [newPassword, setNewPassword] = useState('');

  // 載入用戶列表
  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.message || '載入用戶列表失敗');
      }
    } catch (error) {
      console.error('載入用戶列表錯誤：', error);
      setError('網路錯誤，請稍後再試');
    }
    
    setIsLoading(false);
  };

  // 建立新用戶
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserForm)
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setNewUserForm({
          username: '',
          password: '',
          display_name: '',
          email: '',
          role: 'admin'
        });
        await loadUsers();
      } else {
        setError(result.message || '建立用戶失敗');
      }
    } catch (error) {
      console.error('建立用戶錯誤：', error);
      setError('網路錯誤，請稍後再試');
    }

    setIsLoading(false);
  };

  // 更新用戶
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUserForm)
      });

      const result = await response.json();

      if (result.success) {
        setEditingUser(null);
        await loadUsers();
      } else {
        setError(result.message || '更新用戶失敗');
      }
    } catch (error) {
      console.error('更新用戶錯誤：', error);
      setError('網路錯誤，請稍後再試');
    }

    setIsLoading(false);
  };

  // 更改密碼
  const handleChangePassword = async (userId: number) => {
    if (!newPassword || newPassword.length < 4) {
      setError('密碼長度至少需要 4 個字元');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword })
      });

      const result = await response.json();

      if (result.success) {
        setShowPasswordForm(null);
        setNewPassword('');
        alert('密碼更新成功');
      } else {
        setError(result.message || '更改密碼失敗');
      }
    } catch (error) {
      console.error('更改密碼錯誤：', error);
      setError('網路錯誤，請稍後再試');
    }

    setIsLoading(false);
  };

  // 刪除用戶
  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`確定要刪除用戶 "${username}" 嗎？此操作無法復原。`)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadUsers();
      } else {
        setError(result.message || '刪除用戶失敗');
      }
    } catch (error) {
      console.error('刪除用戶錯誤：', error);
      setError('網路錯誤，請稍後再試');
    }

    setIsLoading(false);
  };

  // 開始編輯用戶
  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      display_name: user.display_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
  };

  // 組件載入時獲取用戶列表
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">用戶身份管理</h1>
          <p className="mt-2 text-gray-600">管理系統用戶帳號和權限</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="mr-2">❌</span>
              {error}
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            共 {users.length} 位用戶
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? '載入中...' : '重新載入'}
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              新增用戶
            </button>
          </div>
        </div>

        {/* 用戶列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色/狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最後登入
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username} • {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-1">
                          {user.role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? '啟用' : '停用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString('zh-TW') : '未曾登入'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="text-cyan-600 hover:text-cyan-900 text-sm"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => setShowPasswordForm(user.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          改密碼
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-600 hover:text-red-900 text-sm"
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
          
          {users.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              暫無用戶資料
            </div>
          )}
        </div>

        {/* 新增用戶表單 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增用戶</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用戶名</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.display_name}
                    onChange={(e) => setNewUserForm({...newUserForm, display_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="admin">管理員</option>
                    <option value="editor">編輯者</option>
                    <option value="viewer">檢視者</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '建立中...' : '建立用戶'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 編輯用戶表單 */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">編輯用戶</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.display_name}
                    onChange={(e) => setEditUserForm({...editUserForm, display_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="admin">管理員</option>
                    <option value="editor">編輯者</option>
                    <option value="viewer">檢視者</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editUserForm.is_active}
                      onChange={(e) => setEditUserForm({...editUserForm, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">啟用帳號</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '更新中...' : '更新用戶'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 更改密碼表單 */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">更改密碼</h3>
                <button
                  onClick={() => setShowPasswordForm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼（至少 4 個字元）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleChangePassword(showPasswordForm)}
                    disabled={isLoading || !newPassword}
                    className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '更新中...' : '更新密碼'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
