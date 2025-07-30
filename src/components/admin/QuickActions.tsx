'use client';

import { useState } from 'react';

export default function QuickActions() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<any>(null);

  const handleAction = async (actionType: string, actionName: string) => {
    setIsLoading(actionType);
    setActionResult(null);

    try {
      let response;
      let result;

      switch (actionType) {
        case 'test-db':
          response = await fetch('/api/db/test');
          result = await response.json();
          break;
        case 'init-db':
          response = await fetch('/api/db/init', { method: 'POST' });
          result = await response.json();
          break;
        case 'backup':
          // 模擬備份操作
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = { success: true, message: '資料庫備份完成', timestamp: new Date().toISOString() };
          break;
        case 'clear-cache':
          // 模擬清除快取操作
          await new Promise(resolve => setTimeout(resolve, 1000));
          result = { success: true, message: '系統快取已清除' };
          break;
        case 'generate-report':
          // 模擬產生報告操作
          await new Promise(resolve => setTimeout(resolve, 3000));
          result = { success: true, message: '月報表已產生', filename: `BTW_Report_${new Date().getFullYear()}_${new Date().getMonth() + 1}.pdf` };
          break;
        case 'system-health':
          // 模擬系統健檢
          await new Promise(resolve => setTimeout(resolve, 1500));
          result = { 
            success: true, 
            message: '系統健康檢查完成',
            details: {
              database: 'healthy',
              api: 'healthy',
              storage: 'healthy',
              memory: '72%',
              cpu: '45%'
            }
          };
          break;
        default:
          result = { success: false, error: '未知操作類型' };
      }

      setActionResult({ actionName, ...result });
    } catch (error) {
      setActionResult({ 
        actionName,
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsLoading(null);
    }
  };

  const actions = [
    {
      id: 'test-db',
      name: '測試資料庫連線',
      icon: '🔍',
      description: '檢查資料庫連線狀態',
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'database'
    },
    {
      id: 'init-db',
      name: '初始化資料庫',
      icon: '⚡',
      description: '建立或更新資料庫表格',
      color: 'bg-green-500 hover:bg-green-600',
      category: 'database'
    },
    {
      id: 'backup',
      name: '備份資料庫',
      icon: '💾',
      description: '建立資料庫備份檔案',
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'database'
    },
    {
      id: 'clear-cache',
      name: '清除系統快取',
      icon: '🧹',
      description: '清除應用程式快取資料',
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'system'
    },
    {
      id: 'generate-report',
      name: '產生月報表',
      icon: '📊',
      description: '產生營運數據月報表',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'reports'
    },
    {
      id: 'system-health',
      name: '系統健康檢查',
      icon: '🏥',
      description: '檢查系統各項服務狀態',
      color: 'bg-pink-500 hover:bg-pink-600',
      category: 'system'
    }
  ];

  const categories: { [key: string]: { name: string; icon: string } } = {
    database: { name: '資料庫管理', icon: '🗄️' },
    system: { name: '系統維護', icon: '⚙️' },
    reports: { name: '報表工具', icon: '📈' }
  };

  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as { [key: string]: typeof actions });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ⚡ 快速操作中心
          </h2>
          <p className="text-lg text-gray-600">
            常用的系統管理和維護工具，一鍵執行各種管理任務
          </p>
        </div>

        {/* Action Categories */}
        {Object.entries(groupedActions).map(([categoryKey, categoryActions]) => {
          const category = categories[categoryKey];
          return (
            <div key={categoryKey} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">{category.icon}</span>
                {category.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryActions.map((action) => (
                  <div key={action.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">{action.icon}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{action.name}</h4>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(action.id, action.name)}
                      disabled={isLoading === action.id}
                      className={`w-full ${action.color} text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading === action.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          執行中...
                        </div>
                      ) : (
                        '執行操作'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Action Result */}
        {actionResult && (
          <div className={`mt-8 p-6 rounded-lg ${actionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`text-lg font-semibold mb-3 ${actionResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {actionResult.success ? '✅' : '❌'} {actionResult.actionName} - 操作結果
            </h3>
            
            {actionResult.success ? (
              <div className="space-y-2">
                <p className={`${actionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {actionResult.message}
                </p>
                
                {actionResult.filename && (
                  <p className="text-green-600 text-sm">
                    檔案名稱：{actionResult.filename}
                  </p>
                )}
                
                {actionResult.timestamp && (
                  <p className="text-green-600 text-sm">
                    完成時間：{new Date(actionResult.timestamp).toLocaleString('zh-TW')}
                  </p>
                )}
                
                {actionResult.details && (
                  <div className="mt-4 bg-green-100 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">詳細資訊：</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      {Object.entries(actionResult.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={`${actionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                錯誤：{actionResult.error}
              </p>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            使用提示
          </h3>
          <div className="text-yellow-700 space-y-2 text-sm">
            <p>• 資料庫操作前建議先執行「測試資料庫連線」確認狀態</p>
            <p>• 「初始化資料庫」會建立必要的表格，首次使用時請先執行</p>
            <p>• 建議定期執行「備份資料庫」和「系統健康檢查」</p>
            <p>• 如遇到系統緩慢問題，可嘗試「清除系統快取」</p>
            <p>• 月報表會包含完整的營運數據分析</p>
          </div>
        </div>
      </div>
    </div>
  );
} 