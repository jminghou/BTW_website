"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const HEARD_FROM_OPTIONS = ['社群平台', 'Google 搜尋', '新聞報導', '親友介紹', '其他'] as const;

const Contact = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const heardFromRef = useRef<HTMLDivElement>(null);
  const [heardFromOpen, setHeardFromOpen] = useState(false);
  const [formData, setFormData] = useState({
    identity: '',
    user_name: '',
    title: '',
    user_email: '',
    phone: '',
    message: '',
    heard_from: [] as string[],
    heard_from_other: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success?: boolean; message?: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, identity: e.target.value }));
  };

  const handleHeardFromChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      heard_from: checked
        ? HEARD_FROM_OPTIONS.filter(item => item === option || prev.heard_from.includes(item))
        : prev.heard_from.filter(item => item !== option),
      heard_from_other: !checked && option === '其他' ? '' : prev.heard_from_other,
    }));
  };

  useEffect(() => {
    if (!heardFromOpen) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!heardFromRef.current?.contains(event.target as Node)) {
        setHeardFromOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [heardFromOpen]);

  // 根據身份代表返回對應的 placeholder 文字
  const getTitlePlaceholder = () => {
    switch (formData.identity) {
      case '企業承辦':
        return '請告知您的公司名稱 *';
      case '餐飲商家':
        return '請告知您的店家名稱 *';
      default:
        return '請告知您的單位名稱 *';
    }
  };

  // 根據身份代表返回對應的訊息區域 placeholder 文字
  const getMessagePlaceholder = () => {
    switch (formData.identity) {
      case '企業承辦':
        return '請問何時方便與您聯絡？';
      case '餐飲商家':
        return '請告知您的所在地區，以及何時方便與您聯絡？';
      default:
        return '請留下您想訊問的訊息';
    }
  };

  // 根據身份代表返回對應的 placeholder 顏色
  const getPlaceholderColor = () => {
    switch (formData.identity) {
      case '餐飲商家':
        return 'placeholder-[#e03838]';
      case '其他':
        return 'placeholder-gray-400';
      default:
        return 'placeholder-[#00bed6]';
    }
  };

  const getHintTextColor = () => {
    switch (formData.identity) {
      case '餐飲商家':
        return 'text-[#e03838]';
      case '其他':
        return 'text-gray-400';
      default:
        return 'text-[#00bed6]';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // 呼叫後端 API (儲存資料並寄送通知信)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus({ 
          success: true, 
          message: '您的訊息已成功送出，我們會盡快回覆您！' 
        });
        
        // 清空表單
        setFormData({
          identity: '',
          user_name: '',
          title: '',
          user_email: '',
          phone: '',
          message: '',
          heard_from: [],
          heard_from_other: '',
        });
        setHeardFromOpen(false);
        if (formRef.current) {
          formRef.current.reset();
        }
      } else {
        throw new Error(result.message || '提交失敗');
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: '提交失敗，請稍後再試或直接聯繫我們。' });
      console.error('提交表單時出錯：', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-8">想了解更多？聯絡我們！</h2>
      <div className="max-w-md mx-auto">
        {submitStatus && (
          <div className={`p-4 mb-4 rounded ${submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {submitStatus.message}
          </div>
        )}
        <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
          <div className="mb-2">
            <p className="mb-2">請問您身份的代表是？</p>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="identity" 
                  value="企業承辦" 
                  className="mr-2" 
                  required 
                  checked={formData.identity === '企業承辦'}
                  onChange={handleRadioChange}
                />
                企業承辦
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="identity" 
                  value="餐飲商家" 
                  className="mr-2"
                  checked={formData.identity === '餐飲商家'}
                  onChange={handleRadioChange}
                />
                餐飲商家
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="identity" 
                  value="其他" 
                  className="mr-2"
                  checked={formData.identity === '其他'}
                  onChange={handleRadioChange}
                />
                其他
              </label>
            </div>
          </div>
          <div className="mb-2" ref={heardFromRef}>
            <p className="mb-2" id="heard-from-label">從何得知浩華？（可複選）</p>
            <div className="relative">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded border bg-white p-2 text-left"
                aria-labelledby="heard-from-label"
                aria-expanded={heardFromOpen}
                aria-haspopup="listbox"
                onClick={() => setHeardFromOpen(open => !open)}
              >
                <span className={formData.heard_from.length === 0 ? getHintTextColor() : 'text-gray-900'}>
                  {formData.heard_from.length === 0
                    ? '請選擇'
                    : formData.heard_from
                        .map(option =>
                          option === '其他' && formData.heard_from_other.trim()
                            ? `其他：${formData.heard_from_other.trim()}`
                            : option,
                        )
                        .join('、')}
                </span>
                <span aria-hidden="true" className={formData.heard_from.length === 0 ? getHintTextColor() : 'text-gray-500'}>{heardFromOpen ? '▴' : '▾'}</span>
              </button>
              {heardFromOpen && (
                <div
                  className="absolute z-20 mt-1 w-full rounded border bg-white py-1 shadow"
                  role="listbox"
                  aria-multiselectable="true"
                  aria-labelledby="heard-from-label"
                >
                  {HEARD_FROM_OPTIONS.map(option => (
                    <label key={option} className="flex cursor-pointer items-center px-3 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        name="heard_from"
                        value={option}
                        className="mr-2"
                        checked={formData.heard_from.includes(option)}
                        onChange={(e) => handleHeardFromChange(option, e.target.checked)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.heard_from.includes('其他') && (
              <input
                type="text"
                name="heard_from_other"
                value={formData.heard_from_other}
                onChange={handleChange}
                className={`mt-2 w-full rounded border p-2 ${getPlaceholderColor()}`}
                placeholder="請說明從何處得知"
              />
            )}
          </div>
          <div>
            <input 
              type="text" 
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${getPlaceholderColor()}`} 
              placeholder="可以怎麼稱呼您 *" 
              required 
            />
          </div>
          <div>
            <input 
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${getPlaceholderColor()}`} 
              placeholder={getTitlePlaceholder()} 
              required
            />
          </div>
          <div>
            <input 
              type="email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${getPlaceholderColor()}`} 
              placeholder="電子郵件 *" 
              required 
            />
          </div>
          <div>
            <input 
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${getPlaceholderColor()}`} 
              placeholder="電話 *" 
              required 
            />
          </div>
          <div>
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${getPlaceholderColor()}`} 
              rows={4} 
              placeholder={getMessagePlaceholder()}
            ></textarea>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            <span className="text-red-500">*</span> 表示必填欄位
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#00bed6] text-white py-2 rounded hover:bg-[#ffb71b]"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '送出'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Contact