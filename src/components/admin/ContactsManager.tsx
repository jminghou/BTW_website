'use client';

import { useState, useEffect } from 'react';

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

export default function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIdentity, setFilterIdentity] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      const result = await response.json();
      
      if (result.success && result.data) {
        setContacts(result.data);
      }
    } catch (error) {
      console.error('載入聯絡表單資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (id: number) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/contacts?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        setContacts(prevContacts => prevContacts.filter(contact => contact.id !== id));
      }
    } catch (error) {
      console.error('刪除聯絡資料失敗:', error);
    } finally {
      setDeleteLoading(null);
      setDeleteConfirm(null);
    }
  };

  const exportToCSV = () => {
    if (filteredContacts.length === 0) return;

    const headers = ['ID', '身份', '姓名', '主旨', '電子信箱', '電話', '訊息', '提交時間'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(contact => [
        contact.id,
        `"${contact.identity}"`,
        `"${contact.user_name}"`,
        `"${contact.title}"`,
        contact.user_email,
        contact.phone || '',
        `"${contact.message.replace(/"/g, '""')}"`,
        new Date(contact.created_at).toLocaleString('zh-TW')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `聯絡表單資料_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

  // 篩選和搜尋
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterIdentity === 'all' || contact.identity === filterIdentity;
    
    return matchesSearch && matchesFilter;
  });

  // 分頁
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueIdentities = [...new Set(contacts.map(contact => contact.identity))];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mt-14 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            官網聯絡表單列表
          </h2>
          <p className="text-lg text-gray-600">
            請定期檢查有沒有人在官網上聯絡我們，看到請及時回覆
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                搜尋聯絡資料
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名、信箱、主旨或訊息..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Filter */}
            <div className="lg:w-48">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                篩選身份
              </label>
              <select
                id="filter"
                value={filterIdentity}
                onChange={(e) => setFilterIdentity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="all">全部身份</option>
                {uniqueIdentities.map(identity => (
                  <option key={identity} value={identity}>{identity}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-gray-500">
              顯示 {filteredContacts.length} 筆資料（共 {contacts.length} 筆）
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadContacts}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '載入中...' : '重新載入'}
              </button>
              {filteredContacts.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  匯出 CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterIdentity !== 'all' ? '沒有符合條件的資料' : '尚無聯絡表單'}
              </p>
              <p className="text-gray-500">
                {searchTerm || filterIdentity !== 'all' ? '請調整搜尋條件' : '目前沒有收到任何聯絡表單資料'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        基本資訊
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        聯絡方式
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        內容
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時間
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedContacts.map((contact, index) => (
                      <tr key={contact.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contact.user_name} (#{contact.id})
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {contact.identity}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm text-gray-900">
                              <a href={`mailto:${contact.user_email}`} className="text-blue-600 hover:text-blue-800">
                                {contact.user_email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="text-sm text-gray-500">
                                <a href={`tel:${contact.phone}`} className="text-green-600 hover:text-green-800">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={contact.title}>
                              {contact.title}
                            </div>
                            <div className="text-sm text-gray-500 max-h-12 overflow-hidden">
                              {contact.message}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(contact.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          {deleteConfirm === contact.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={deleteLoading === contact.id}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {deleteLoading === contact.id ? '刪除中...' : '確認刪除'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(contact.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              刪除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700">
                        第 <span className="font-medium">{currentPage}</span> 頁，共{' '}
                        <span className="font-medium">{totalPages}</span> 頁
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        上一頁
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        下一頁
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 