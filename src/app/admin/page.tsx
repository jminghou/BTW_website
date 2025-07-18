'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/db/test');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const initDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/db/init', { method: 'POST' });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const getContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">資料庫管理頁面</h1>
      
      <div className="grid gap-4 mb-8">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? '測試中...' : '測試資料庫連接'}
        </button>
        
        <button
          onClick={initDatabase}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? '初始化中...' : '初始化資料庫表格'}
        </button>
        
        <button
          onClick={getContacts}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? '載入中...' : '查看聯絡表單資料'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">測試結果：</h2>
          <pre className="bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-100 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">📝 設定環境變數</h3>
        <p className="text-yellow-700">
          請確保您已在 .env.local 檔案中設定了正確的 Postgres 連接資訊。
          如果測試失敗，請檢查環境變數是否正確設定。
        </p>
      </div>
    </div>
  );
} 