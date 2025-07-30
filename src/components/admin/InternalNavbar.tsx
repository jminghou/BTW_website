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
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 fixed w-full z-50 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img
              className="h-8 w-auto"
              src="/images/btw_full_logo.png"
              alt="BTW Internal"
            />
            <span className="ml-3 text-sm font-medium text-gray-600 bg-blue-100 px-2 py-1 rounded">
              內部員工系統
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('dashboard')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                📊 儀表板
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                📋 聯絡表單
              </button>
              <button
                onClick={() => scrollToSection('employee-info')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                👥 員工資訊
              </button>
              <button
                onClick={() => scrollToSection('company-data')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🏢 公司資料
              </button>
              <button
                onClick={() => scrollToSection('quick-actions')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ⚡ 快速操作
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🚪 登出
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-gray-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
          <button
            onClick={() => scrollToSection('dashboard')}
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            📊 儀表板
          </button>
          <button
            onClick={() => scrollToSection('contacts')}
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            📋 聯絡表單
          </button>
          <button
            onClick={() => scrollToSection('employee-info')}
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            👥 員工資訊
          </button>
          <button
            onClick={() => scrollToSection('company-data')}
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            🏢 公司資料
          </button>
          <button
            onClick={() => scrollToSection('quick-actions')}
            className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            ⚡ 快速操作
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors"
          >
            🚪 登出
          </button>
        </div>
      </div>
    </nav>
  );
} 