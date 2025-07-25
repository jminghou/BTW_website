"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import emailjs from '@emailjs/browser';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // 1. 儲存到資料庫
      const dbResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const dbResult = await dbResponse.json();
      console.log('資料庫儲存結果：', dbResult);

      // 2. 使用Email.js发送邮件
      const emailResult = await emailjs.send(
        'service_a5sxzjy',
        'template_1uojjcj',
        {
          identity: formData.identity,
          user_name: formData.user_name,
          title: formData.title,
          user_email: formData.user_email,
          phone: formData.phone,
          message: formData.message,
          // 设置发件人名称为用户填写的名称
          from_name: formData.user_name,
          // 收件人设置为service@haohuagroup.com.tw（与发件人相同）
          to_name: '客服團隊',
          to_email: 'service@haohuagroup.com.tw',
          // 设置回复地址为用户的邮箱，方便直接回复
          reply_to: formData.user_email
        },
        'AOvvrQejq7rqpRw--'
      );
      
      if (emailResult.text === 'OK') {
        setSubmitStatus({ 
          success: true, 
          message: dbResult.success 
            ? '您的訊息已成功送出並儲存，我們會盡快回覆您！' 
            : '您的訊息已成功送出，我們會盡快回覆您！（資料儲存可能失敗）'
        });
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
        throw new Error('郵件發送失敗');
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
                  value="企業餐飲承辦" 
                  className="mr-2" 
                  required 
                  checked={formData.identity === '企業餐飲承辦'}
                  onChange={handleRadioChange}
                />
                企業餐飲承辦
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
              className="w-full p-2 border rounded" 
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
              className="w-full p-2 border rounded" 
              placeholder="您的單位/職稱" 
            />
          </div>
          <div>
            <input 
              type="email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className="w-full p-2 border rounded" 
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
              className="w-full p-2 border rounded" 
              placeholder="電話 *" 
              required 
            />
          </div>
          <div>
            <textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-2 border rounded" 
              rows={4} 
              placeholder="請留下您的訊息"
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