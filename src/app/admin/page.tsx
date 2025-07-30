'use client';

import { useState } from 'react';
import InternalNavbar from '@/components/admin/InternalNavbar';
import Dashboard from '@/components/admin/Dashboard';
import ContactsManager from '@/components/admin/ContactsManager';
import EmployeeInfo from '@/components/admin/EmployeeInfo';
import CompanyData from '@/components/admin/CompanyData';
import QuickActions from '@/components/admin/QuickActions';

interface Contact {
  id: number;
  identity: string;
  user_name: string;
  title: string;
  user_email: string;
  phone: string;
  message: string;
  created_at: string;
}

interface LoginForm {
  username: string;
  password: string;
}

export default function AdminPage() {
  // 驗證狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 清理不再需要的狀態，現在由各組件管理自己的狀態

  // 登入驗證邏輯
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    // 這裡設定簡單的硬編碼驗證，您可以後續改為從資料庫驗證
    const validCredentials = {
      username: 'admin',
      password: 'btw2024admin'
    };

    // 模擬API請求延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (loginForm.username === validCredentials.username && 
        loginForm.password === validCredentials.password) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('帳號或密碼錯誤，請重新輸入');
    }

    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError(''); // 清除錯誤訊息
  };

  // 如果未登入，顯示登入表單
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-4xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900">管理員登入</h2>
            <p className="mt-2 text-sm text-gray-600">請輸入您的帳號密碼以存取管理控制台</p>
          </div>
          
          <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  帳號
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="請輸入管理員帳號"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="請輸入密碼"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <span className="mr-2">❌</span>
                  {loginError}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingIn ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登入中...
                </div>
              ) : (
                '登入管理控制台'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              此為管理員專用頁面，如有疑問請聯繫系統管理員
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 如果已登入，顯示一頁式內部員工網頁
  return (
    <main className="min-h-screen">
      <InternalNavbar onLogout={handleLogout} />
      
      <section id="dashboard" className="min-h-screen">
        <Dashboard />
      </section>
      
      <section id="contacts" className="min-h-screen">
        <ContactsManager />
      </section>
      
      <section id="employee-info" className="min-h-screen">
        <EmployeeInfo />
      </section>
      
      <section id="company-data" className="min-h-screen">
        <CompanyData />
      </section>
      
      <section id="quick-actions" className="min-h-screen">
        <QuickActions />
      </section>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2024 BTW 內部員工管理系統. 所有權利保留.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            本系統僅供內部員工使用，請勿外洩任何資訊
          </p>
        </div>
      </footer>
    </main>
  );
} 