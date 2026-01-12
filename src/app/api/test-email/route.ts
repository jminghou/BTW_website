import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    // 1. 檢查環境變數
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? '****** (已設定)' : '(未設定)',
    };

    console.log('測試郵件環境變數:', envCheck);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        message: 'SMTP 帳號或密碼未設定',
        env: envCheck
      }, { status: 500 });
    }

    // 2. 建立 Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. 測試連線 (Verify)
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.error('SMTP 連線驗證失敗:', error);
          reject(error);
        } else {
          console.log('SMTP 連線驗證成功');
          resolve(success);
        }
      });
    });

    // 4. 嘗試寄送測試信
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"測試系統" <${process.env.SMTP_USER}>`,
      to: 'service@haohuagroup.com.tw', // 寄給自己測試
      subject: 'SMTP 設定測試信',
      text: '這是一封測試信，如果您收到這封信，代表 SMTP 設定正確！',
      html: '<b>這是一封測試信</b>，如果您收到這封信，代表 SMTP 設定正確！',
    });

    return NextResponse.json({
      success: true,
      message: '測試信發送成功',
      info: info,
      env: envCheck
    });

  } catch (error: any) {
    console.error('測試過程發生錯誤:', error);
    return NextResponse.json({
      success: false,
      message: '測試失敗',
      error: error.message,
      stack: error.stack,
      env: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER,
        // 不回傳密碼
      }
    }, { status: 500 });
  }
}

