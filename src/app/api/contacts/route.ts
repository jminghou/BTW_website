import { NextRequest, NextResponse } from 'next/server';
import { saveContact, getContacts, deleteContact } from '../../../lib/db';
import nodemailer from 'nodemailer';

/**
 * 聯絡表單 API 路由
 * POST /api/contacts - 儲存聯絡表單資料並發送通知信
 * GET /api/contacts - 取得所有聯絡表單資料
 */

// 建立郵件傳送器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identity, user_name, title, user_email, phone, message } = body;

    // 基本驗證
    if (!identity || !user_name || !title || !user_email || !message) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    const result = await saveContact({
      identity,
      user_name,
      title,
      user_email,
      phone,
      message
    });

    if (result.success) {
      // 資料庫儲存成功後，嘗試發送郵件
      try {
        const transporter = createTransporter();
        
        // 準備郵件內容
        const mailOptions = {
          from: process.env.SMTP_FROM || `"官網聯絡表單" <${process.env.SMTP_USER}>`,
          to: 'service@haohuagroup.com.tw', // 寄給客服
          replyTo: user_email, // 設定回信地址為訪客信箱
          subject: `【官網聯絡通知】${user_name} - ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
              <h2 style="color: #00bed6;">收到新的聯絡表單</h2>
              <p>有訪客在官網留下了新的訊息，詳細資料如下：</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; width: 100px; font-weight: bold;">身份</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${identity}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">姓名/單位</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${user_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">主旨</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">Email</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${user_email}">${user_email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">電話</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone || '未提供'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold; vertical-align: top;">訊息內容</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${message}</td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                此郵件由系統自動發送，請勿直接回覆此郵件。<br>
                若要回覆訪客，請直接點擊上方 Email 連結。
              </div>
            </div>
          `
        };

        // 發送郵件
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          await transporter.sendMail(mailOptions);
          console.log('郵件發送成功');
        } else {
          console.warn('未設定 SMTP 資訊，跳過郵件發送');
        }

      } catch (emailError) {
        console.error('郵件發送失敗：', emailError);
        // 注意：即使寄信失敗，我們還是回傳成功，因為資料已經存入資料庫了
        // 我們只在後台記錄錯誤
      }

      return NextResponse.json({
        success: true,
        message: '聯絡表單提交成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '儲存聯絡表單資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getContacts();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        message: '聯絡表單資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得聯絡表單資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取聯絡表單資料失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必要的 ID 參數' },
        { status: 400 }
      );
    }

    const result = await deleteContact(parseInt(id));
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `成功刪除聯絡表單資料 (ID: ${id})`,
        deletedId: parseInt(id)
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: typeof result.error === 'string' && result.error.includes('找不到') ? 404 : 500 }
      );
    }
  } catch (error) {
    console.error('刪除聯絡表單資料失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 