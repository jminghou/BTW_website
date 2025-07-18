import { sql } from '@vercel/postgres';

/**
 * 資料庫連接工具
 * 使用 Vercel Postgres 提供的 sql 函數來執行 SQL 查詢
 */

// 測試資料庫連接
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('資料庫連接成功！', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('資料庫連接失敗：', error);
    return { success: false, error: error };
  }
}

// 建立基本表格的函數
export async function createTables() {
  try {
    // 建立聯絡表單資料表
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        identity VARCHAR(50) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 建立訂閱電子報資料表
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('資料表建立成功！');
    return { success: true, message: '資料表建立成功' };
  } catch (error) {
    console.error('建立資料表時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 儲存聯絡表單資料
export async function saveContact(contactData: {
  identity: string;
  user_name: string;
  title: string;
  user_email: string;
  phone?: string;
  message: string;
}) {
  try {
    const result = await sql`
      INSERT INTO contacts (identity, user_name, title, user_email, phone, message)
      VALUES (${contactData.identity}, ${contactData.user_name}, ${contactData.title}, 
              ${contactData.user_email}, ${contactData.phone || ''}, ${contactData.message})
      RETURNING *;
    `;

    console.log('聯絡表單資料儲存成功！', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('儲存聯絡表單資料時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 取得所有聯絡表單資料
export async function getContacts() {
  try {
    const result = await sql`
      SELECT * FROM contacts 
      ORDER BY created_at DESC;
    `;

    return { success: true, data: result.rows };
  } catch (error) {
    console.error('取得聯絡表單資料時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 儲存電子報訂閱
export async function saveNewsletterSubscription(email: string, name?: string) {
  try {
    const result = await sql`
      INSERT INTO newsletter_subscriptions (email, name)
      VALUES (${email}, ${name || ''})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    console.log('電子報訂閱儲存成功！', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('儲存電子報訂閱時發生錯誤：', error);
    return { success: false, error: error };
  }
} 