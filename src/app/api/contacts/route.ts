import { NextRequest, NextResponse } from 'next/server';
import { saveContact, getContacts, deleteContact, updateContactEmailStatus } from '../../../lib/db';
import { getMissingMicrosoftMailEnv, sendMicrosoftMail } from '../../../lib/microsoft-mail';

/**
 * 聯絡表單 API 路由
 * POST /api/contacts - 儲存聯絡表單資料並以 Microsoft Graph 發送通知信
 * GET /api/contacts - 取得所有聯絡表單資料
 */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identity, user_name, title, user_email, phone, message } = body;

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
      const contactId = result.data?.id as number | undefined;
      let emailStatus: 'sent' | 'failed' = 'failed';
      let emailError: string | null = null;

      try {
        const missing = getMissingMicrosoftMailEnv();
        if (missing.length > 0) {
          emailError = `未設定 Microsoft Graph：缺少 ${missing.join(', ')}`;
          console.warn(emailError);
        } else {
          const safeIdentity = escapeHtml(String(identity));
          const safeName = escapeHtml(String(user_name));
          const safeTitle = escapeHtml(String(title));
          const safeEmail = escapeHtml(String(user_email));
          const safePhone = escapeHtml(String(phone || '未提供'));
          const safeMessage = escapeHtml(String(message));

          await sendMicrosoftMail({
            subject: `${identity}_${title}_${user_name}`,
            replyTo: user_email,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #00bed6;">收到新的聯絡表單</h2>
                <p>有訪客在官網留下了新的訊息，詳細資料如下：</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; width: 100px; font-weight: bold;">身份</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${safeIdentity}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">姓名/單位</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">主旨</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${safeTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">Email</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold;">電話</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background-color: #f9f9f9; font-weight: bold; vertical-align: top;">訊息內容</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${safeMessage}</td>
                  </tr>
                </table>
                
                <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                  此郵件由系統自動發送，請勿直接回覆此郵件。<br>
                  若要回覆訪客，請直接點擊上方 Email 連結。
                </div>
              </div>
            `
          });
          emailStatus = 'sent';
          console.log('郵件發送成功');
        }
      } catch (emailErr) {
        emailError = getErrorMessage(emailErr);
        console.error('郵件發送失敗：', emailErr);
      }

      if (contactId) {
        await updateContactEmailStatus(contactId, emailStatus, emailError);
      }

      return NextResponse.json({
        success: true,
        message: '聯絡表單提交成功！',
        data: {
          ...result.data,
          email_status: emailStatus,
          email_error: emailError,
        }
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
