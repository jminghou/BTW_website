'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnnualGoalsManager from '@/components/admin/AnnualGoalsManager';
import CompanyStatsManager from '@/components/admin/CompanyStatsManager';
import PartnersManager from '@/components/admin/PartnersManager';
import RegionsManager from '@/components/admin/RegionsManager';

interface LoginForm {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: string;
}

export default function EditorPage() {
  const router = useRouter();
  
  // 驗證狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 當前選中的編輯器
  const [activeEditor, setActiveEditor] = useState('annual-goals');

  // 編輯器選項
  const editorTabs = [
    { 
      id: 'annual-goals', 
      name: '年度目標', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'company-stats', 
      name: '公司統計', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'partners', 
      name: '企業客戶', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      id: 'regions', 
      name: '區域資料', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    }
  ];

  // 檢查登入狀態
  useEffect(() => {
    const checkAuthStatus = () => {
      const authData = localStorage.getItem('admin_auth');
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          if (userData && userData.role === 'admin') {
            setCurrentUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('admin_auth');
          }
        } catch (error) {
          localStorage.removeItem('admin_auth');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 登入處理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.role !== 'admin') {
          setLoginError('此頁面僅限管理員使用');
          return;
        }

        localStorage.setItem('admin_auth', JSON.stringify(result.data));
        setCurrentUser(result.data);
        setIsAuthenticated(true);
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(result.message || '登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setLoginError('登入過程中發生錯誤');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 登出處理
  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  // 返回主管理頁面
  const goToMainAdmin = () => {
    router.push('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果未登入，顯示登入表單
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BTW</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              數據編輯後台
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              僅限管理員使用
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  帳號
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:z-10 sm:text-sm"
                  placeholder="請輸入管理員帳號"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:z-10 sm:text-sm"
                  placeholder="請輸入密碼"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoggingIn ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登入中...
                  </div>
                ) : (
                  '登入'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 已登入，顯示編輯器介面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BTW</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">數據編輯後台</h1>
                <p className="text-sm text-gray-500">歡迎回來，{currentUser?.display_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={goToMainAdmin}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回主頁面
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">數據編輯器</h2>
              <nav className="space-y-2">
                {editorTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEditor(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeEditor === tab.id
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {activeEditor === 'annual-goals' && (
                <AnnualGoalsManager />
              )}
              
              {activeEditor === 'company-stats' && (
                <CompanyStatsManager />
              )}
              
              {activeEditor === 'partners' && (
                <PartnersManager />
              )}
              
              {activeEditor === 'regions' && (
                <RegionsManager />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
