'use client';

import { useState } from 'react';

export default function BtwDownload() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<any>(null);

  const handleDownload = async (downloadType: string, fileName: string) => {
    setIsLoading(downloadType);
    setDownloadResult(null);

    try {
      // 模擬下載延遲
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模擬文件下載
      const link = document.createElement('a');
      link.style.display = 'none';
      
      switch (downloadType) {
        case 'brand-guide':
          // 模擬品牌指南下載
          link.href = '/images/btw_full_logo.png'; // 使用現有的logo作為示例
          link.download = 'BTW_品牌指南_2024.pdf';
          break;
        case 'logo-package':
          // 模擬Logo包下載
          link.href = '/images/btw_bird_logo.png';
          link.download = 'BTW_Logo包_完整版.zip';
          break;
        case 'business-proposal':
          // 模擬商業提案下載
          link.href = '/images/landingpage/about_us.jpg';
          link.download = 'BTW_商業提案_2024Q4.pdf';
          break;
        case 'training-manual':
          // 模擬培訓手冊下載
          link.href = '/images/landingpage/step_1.png';
          link.download = 'BTW_員工培訓手冊_v2.0.pdf';
          break;
        case 'operation-guide':
          // 模擬操作說明下載
          link.href = '/images/landingpage/machine.jpg';
          link.download = 'BTW_設備操作說明_最新版.pdf';
          break;
        case 'monthly-report':
          // 模擬月報表下載
          link.href = '/images/landingpage/investment.jpg';
          link.download = `BTW_月報表_${new Date().getFullYear()}_${new Date().getMonth() + 1}.pdf`;
          break;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadResult({ 
        fileName, 
        success: true, 
        message: '文件下載成功',
        downloadedFile: link.download,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDownloadResult({ 
        fileName,
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setIsLoading(null);
    }
  };

  const downloadItems = [
    {
      id: 'brand-guide',
      name: 'BTW 品牌手冊',
      description: '完整的品牌使用指南，包含標誌使用規範、色彩搭配等',
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'brand'
    },
    {
      id: 'logo-package',
      name: 'Logo 完整包',
      description: '包含各種格式的BTW標誌檔案（PNG、SVG、AI等）',
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'brand'
    },
    {
        id: 'logo-package',
        name: '各廠區 QR Code',
        description: '包含各種格式的BTW標誌檔案（PNG、SVG、AI等）',
        color: 'bg-blue-500 hover:bg-blue-600',
        category: 'brand'
      },
    {
      id: 'business-proposal',
      name: 'BTW 投資人提案範本',
      description: 'BTW標準商業提案範本，適用於合作夥伴簡報',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      category: 'business'
    },
    {
        id: 'business-proposal',
        name: 'BTW 企業提案範本',
        description: 'BTW標準商業提案範本，適用於合作夥伴簡報',
        color: 'bg-cyan-500 hover:bg-cyan-600',
        category: 'business'
      },
      {
        id: 'business-proposal',
        name: 'BTW 餐廳合作提案範本',
        description: 'BTW標準商業提案範本，適用於合作夥伴簡報',
        color: 'bg-cyan-500 hover:bg-cyan-600',
        category: 'business'
      },
    {
      id: 'training-manual',
      name: '營運培訓工作手冊',
      description: '新進員工培訓教材與標準作業流程',
      color: 'bg-green-500 hover:bg-green-600',
      category: 'training'
    },
    {
      id: 'operation-guide',
      name: '機台設備操作說明',
      description: '各類設備的詳細操作指南與維護手冊',
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'training'
    },
    
  ];

  const categories: { [key: string]: { name: string } } = {
    brand: { name: '品牌資產文件' },
    training: { name: '培訓操作說明' },
    business: { name: '公司簡報範本' }
  };

  const groupedDownloads = downloadItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as { [key: string]: typeof downloadItems });

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            重要文件下載
          </h2>
          <p className="text-lg text-gray-600">
            下載BTW相關的重要文件與資源，包含品牌資產、培訓教材及商業文件
          </p>
        </div>

        {/* Download Categories */}
        {Object.entries(groupedDownloads).map(([categoryKey, categoryItems]) => {
          const category = categories[categoryKey];
          return (
            <div key={categoryKey} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {category.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(item.id, item.name)}
                      disabled={isLoading === item.id}
                      className={`w-full ${item.color} text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                    >
                      {isLoading === item.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          下載中...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          下載檔案
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Download Result */}
        {downloadResult && (
          <div className={`mt-8 p-6 rounded-lg border ${downloadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-lg font-semibold mb-3 ${downloadResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {downloadResult.fileName} - 下載結果
            </h3>
            
            {downloadResult.success ? (
              <div className="space-y-3">
                <p className="text-green-700">
                  {downloadResult.message}
                </p>
                
                {downloadResult.downloadedFile && (
                  <p className="text-green-600 text-sm">
                    檔案名稱：{downloadResult.downloadedFile}
                  </p>
                )}
                
                {downloadResult.timestamp && (
                  <p className="text-green-600 text-sm">
                    下載時間：{new Date(downloadResult.timestamp).toLocaleString('zh-TW')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-700">
                錯誤：{downloadResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}