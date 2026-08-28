import { NextResponse } from 'next/server';
import { getMicrosoftMailStatus, sendMicrosoftMail } from '../../../lib/microsoft-mail';

export async function GET() {
  try {
    const envCheck = getMicrosoftMailStatus();

    if (!envCheck.MICROSOFT_TENANT_ID || !envCheck.MICROSOFT_CLIENT_ID || !envCheck.MICROSOFT_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        message: 'Microsoft Graph 尚未設定完成',
        env: envCheck
      }, { status: 500 });
    }

    await sendMicrosoftMail({
      subject: 'Microsoft Graph 寄信測試',
      html: '<b>這是一封測試信</b>，如果您收到這封信，代表 Microsoft Graph 寄信設定正確。',
    });

    return NextResponse.json({
      success: true,
      message: '測試信發送成功',
      env: envCheck
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('測試過程發生錯誤:', error);
    return NextResponse.json({
      success: false,
      message: '測試失敗',
      error: message,
      env: getMicrosoftMailStatus()
    }, { status: 500 });
  }
}
