'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FIELD_SITE_HOME,
  LOGIN_FACTORIES,
  LOGIN_IDENTITIES,
  fieldStaffHome,
  isFieldStaff,
  readStaffSession,
} from '@/lib/fieldAccess';
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
  loginAs: 'admin' | 'field';
  siteId: string;
}

export default function AdminPage() {
  const router = useRouter();
  // 驗證狀態
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: '',
    password: '',
    loginAs: 'admin',
    siteId: '3',
  });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [fieldRedirect, setFieldRedirect] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const session = readStaffSession();
    if (isFieldStaff(session)) {
      const home = fieldStaffHome(session);
      if (home) {
        setFieldRedirect(true);
        router.replace(home);
        return;
      }
      localStorage.removeItem('userInfo');
    }
    setSessionChecked(true);
  }, [router]);

  // 登入驗證邏輯 - 從資料庫驗證
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
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const result = await response.json();

      if (!result.success) {
        setLoginError(result.message || '登入失敗，請重新輸入');
        return;
      }

      const accountRole = result.data?.role;

      if (loginForm.loginAs === 'field') {
        if (accountRole !== 'field') {
          setLoginError('此帳號不是現場人員');
          return;
        }
        const home = FIELD_SITE_HOME[Number(loginForm.siteId)];
        if (!home) {
          setLoginError('此廠區尚未開放現場人員登入');
          return;
        }
        localStorage.setItem('userInfo', JSON.stringify({
          ...result.data,
          loginAs: 'field',
          siteId: Number(loginForm.siteId),
        }));
        setFieldRedirect(true);
        router.replace(home);
        return;
      }

      if (accountRole === 'field') {
        setLoginError('現場人員請改選「現場人員」身份登入');
        return;
      }

      localStorage.setItem('userInfo', JSON.stringify({
        ...result.data,
        loginAs: 'admin',
      }));
      setIsAuthenticated(true);
      setLoginError('');
    } catch (error) {
      console.error('登入錯誤：', error);
      setLoginError('網路錯誤，請稍後再試');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '', loginAs: 'admin', siteId: '3' });
    // 清除儲存的用戶資訊
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError(''); // 清除錯誤訊息
  };

  if (fieldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">前往廠區頁面...</div>
      </div>
    );
  }

  if (!sessionChecked && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">驗證中...</div>
      </div>
    );
  }

  // 如果未登入，顯示登入表單
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Image
              src="/svg/btw_logo_b.svg"
              alt="浩華 BTW"
              width={200}
              height={40}
              className="mx-auto mb-6 h-auto w-44"
              priority
            />
            <h2 className="text-xl font-bold text-[#00bed6]">浩華內部員工登入</h2>
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
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label id="login-identity-label" className="block text-sm font-medium text-gray-700 mb-2">
                  登入身份
                </label>
                <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="login-identity-label">
                  <select
                    id="loginAs"
                    name="loginAs"
                    aria-label="身份"
                    value={loginForm.loginAs}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                  >
                    {LOGIN_IDENTITIES.map((identity) => (
                      <option key={identity.value} value={identity.value}>{identity.label}</option>
                    ))}
                  </select>
                  <select
                    id="siteId"
                    name="siteId"
                    aria-label="廠區"
                    value={loginForm.siteId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                  >
                    {LOGIN_FACTORIES.map((factory) => (
                      <option key={factory.id} value={factory.id}>{factory.label}</option>
                    ))}
                  </select>
                </div>
                {loginForm.loginAs === 'field' && (
                  <p className="mt-2 text-xs text-gray-500">目前僅開放世界3廠</p>
                )}
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