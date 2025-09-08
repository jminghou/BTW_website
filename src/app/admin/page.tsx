'use client';

import { useState, useEffect } from 'react';
import InternalNavbar from '@/components/admin/InternalNavbar';
import Dashboard from '@/components/admin/Dashboard';
import ContactsManager from '@/components/admin/ContactsManager';
import EmployeeInfo from '@/components/admin/EmployeeInfo';
import CompanyData from '@/components/admin/CompanyData';
import BtwDownload from '@/components/admin/BtwDownload';
import UserManager from '@/components/admin/UserManager';

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
  
  // 資料庫初始化狀態
  const [isInitializing, setIsInitializing] = useState(false);
  const [initMessage, setInitMessage] = useState('');
  const [showInitButton, setShowInitButton] = useState(true); // 預設顯示，檢查後再隱藏

  // 清理不再需要的狀態，現在由各組件管理自己的狀態

  // 檢查資料庫狀態
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'test',
            password: 'test'
          })
        });
        
        const result = await response.json();
        
        // 如果資料庫正常且有使用者存在，隱藏初始化按鈕
        if (result.success) {
          setShowInitButton(false);
        } else if (result.needsInit || 
            result.message?.includes('relation "users" does not exist') || 
            result.message?.includes('帳號不存在') ||
            result.message?.includes('資料庫表格不存在')) {
          setShowInitButton(true);
        } else {
          // 其他錯誤情況（如密碼錯誤）可能表示資料庫正常，隱藏初始化按鈕
          setShowInitButton(false);
        }
      } catch (error) {
        console.log('資料庫狀態檢查失敗:', error);
        // 如果連接失敗，也顯示初始化按鈕
        setShowInitButton(true);
      }
    };

    checkDatabaseStatus();
  }, []);

  // 登入驗證邏輯 - 從資料庫驗證
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    let response;
    try {
      response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        setLoginError('');
        // 可以儲存用戶資訊到 localStorage 或狀態管理中
        if (typeof window !== 'undefined') {
          localStorage.setItem('userInfo', JSON.stringify(result.data));
        }
      } else {
        setLoginError(result.message || '登入失敗，請重新輸入');
        // 如果是因為資料庫表格不存在的錯誤，顯示初始化按鈕
        // 檢查是否需要初始化資料庫
        if (result.needsInit || 
            result.message?.includes('relation "users" does not exist') ||
            result.message?.includes('資料庫表格不存在') ||
            result.message?.includes('帳號不存在或已停用')) {
          setShowInitButton(true);
          setLoginError('資料庫尚未初始化，請先點選下方按鈕初始化資料庫');
        }
      }
    } catch (error) {
      console.error('登入錯誤：', error);
      // 如果是網路錯誤且可能是資料庫表格不存在，顯示初始化按鈕
      const errorString = error instanceof Error ? error.message : String(error);
      if (errorString.includes('relation "users" does not exist') || 
          errorString.includes('users') ||
          response?.status === 401) {
        setShowInitButton(true);
        setLoginError('資料庫可能尚未初始化，請先點選下方按鈕初始化資料庫');
      } else {
        setLoginError('網路錯誤，請稍後再試');
      }
    }

    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    // 清除儲存的用戶資訊
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError(''); // 清除錯誤訊息
  };

  // 初始化資料庫
  const handleInitDatabase = async () => {
    setIsInitializing(true);
    setInitMessage('');

    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setInitMessage('資料庫初始化成功！預設管理員帳號：admin，密碼：5241');
        setShowInitButton(false);
        setLoginError('');
      } else {
        setInitMessage('初始化失敗：' + (result.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('初始化錯誤：', error);
      setInitMessage('網路錯誤，請稍後再試');
    }

    setIsInitializing(false);
  };

  // 如果未登入，顯示登入表單
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-4xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900">浩華內部員工登入</h2>
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

            {initMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  {initMessage}
                </div>
              </div>
            )}

            {showInitButton && (
              <button
                type="button"
                onClick={handleInitDatabase}
                disabled={isInitializing}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
              >
                {isInitializing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    初始化中...
                  </div>
                ) : (
                  '🛠️ 初始化資料庫'
                )}
              </button>
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
      
      {/* <section id="dashboard" className="min-h-screen">
        <Dashboard />
      </section> */}
      
      
      
      <section id="employee-info" className="min-h-screen">
        <EmployeeInfo />
      </section>

      <section id="contacts" className="min-h-screen">
        <ContactsManager />
      </section>
      
      <section id="company-data" className="min-h-screen">
        <CompanyData />
      </section>
      
      <section id="user-management" className="min-h-screen">
        <UserManager />
      </section>
      
      <section id="download" className="min-h-screen">
        <BtwDownload />
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