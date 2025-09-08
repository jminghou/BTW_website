'use client';

import { useState } from 'react';

interface InternalNavbarProps {
  onLogout: () => void;
}

export default function InternalNavbar({ onLogout }: InternalNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50 top-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BTW</span>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              內部管理系統
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {/*<button
                onClick={() => scrollToSection('dashboard')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                儀表板
              </button>*/}
              <button
                onClick={() => scrollToSection('contacts')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                聯絡表單
              </button>
              <button
                onClick={() => scrollToSection('employee-info')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                員工資訊
              </button>
              <button
                onClick={() => scrollToSection('company-data')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                公司資料
              </button>
              <button
                onClick={() => scrollToSection('user-management')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                用戶管理
              </button>
              <button
                onClick={() => scrollToSection('download')}
                className="text-gray-600 hover:text-cyan-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                文件下載
              </button>
              <a
                href="/admin/editor"
                className="text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                數據編輯
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                登出
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
            >
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
        {/* <button
            onClick={() => scrollToSection('dashboard')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            儀表板
          </button> */}
          <button
            onClick={() => scrollToSection('contacts')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            聯絡表單
          </button>
          <button
            onClick={() => scrollToSection('employee-info')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            員工資訊
          </button>
          <button
            onClick={() => scrollToSection('company-data')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            公司資料
          </button>
          <button
            onClick={() => scrollToSection('user-management')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            用戶管理
          </button>
          <button
            onClick={() => scrollToSection('download')}
            className="text-gray-600 hover:text-cyan-600 hover:bg-gray-50 block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            文件下載
          </button>
          <a
            href="/admin/editor"
            className="text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            數據編輯
          </a>
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white block px-3 py-2 rounded-lg text-base font-medium w-full text-left transition-colors duration-200"
          >
            登出
          </button>
        </div>
      </div>
    </nav>
  );
} 