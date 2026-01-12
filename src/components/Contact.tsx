"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const Contact = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    identity: '',
    user_name: '',
    title: '',
    user_email: '',
    phone: '',
    message: ''
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
          message: ''
        });
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
        <div className="mt-6 text-center text-gray-600">
          <p>或者您可以直接發送郵件至：<a href="mailto:service@haohuagroup.com.tw" className="text-[#00bed6] hover:underline">service@haohuagroup.com.tw</a></p>
        </div>
      </div>
    </div>
  )
}

export default Contact