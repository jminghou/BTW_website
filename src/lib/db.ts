import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

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
    // 建立用戶身份管理資料表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

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

    // 檢查是否有預設管理員，如果沒有則建立
    const existingAdmin = await sql`
      SELECT id FROM users WHERE username = 'admin';
    `;

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('5241', 12);
      await sql`
        INSERT INTO users (username, password_hash, display_name, email, role)
        VALUES ('admin', ${hashedPassword}, '系統管理員', 'admin@btw.com', 'admin');
      `;
      console.log('預設管理員帳號已建立');
    }

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

// 刪除指定 ID 的聯絡表單資料
export async function deleteContact(id: number) {
  try {
    // 先檢查資料是否存在
    const checkResult = await sql`
      SELECT id FROM contacts WHERE id = ${id};
    `;
    
    if (checkResult.rows.length === 0) {
      return { success: false, error: '找不到指定的聯絡表單資料' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM contacts WHERE id = ${id}
      RETURNING id;
    `;

    console.log('聯絡表單資料刪除成功！', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('刪除聯絡表單資料時發生錯誤：', error);
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

// ================== 用戶身份管理功能 ==================

// 用戶登入驗證
export async function authenticateUser(username: string, password: string) {
  try {
    const result = await sql`
      SELECT id, username, password_hash, display_name, email, role, is_active 
      FROM users 
      WHERE username = ${username} AND is_active = true;
    `;

    if (result.rows.length === 0) {
      return { success: false, error: '帳號不存在或已停用' };
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, error: '密碼錯誤' };
    }

    // 更新最後登入時間
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id};
    `;

    // 回傳用戶資訊（不包含密碼）
    const { password_hash, ...userInfo } = user;
    console.log('用戶登入成功：', userInfo.username);
    return { success: true, data: userInfo };
  } catch (error) {
    console.error('用戶驗證時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 建立新用戶
export async function createUser(userData: {
  username: string;
  password: string;
  display_name: string;
  email: string;
  role?: string;
}) {
  try {
    // 檢查用戶名是否已存在
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${userData.username} OR email = ${userData.email};
    `;

    if (existingUser.rows.length > 0) {
      return { success: false, error: '用戶名或email已存在' };
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const result = await sql`
      INSERT INTO users (username, password_hash, display_name, email, role)
      VALUES (${userData.username}, ${hashedPassword}, ${userData.display_name}, 
              ${userData.email}, ${userData.role || 'admin'})
      RETURNING id, username, display_name, email, role, is_active, created_at;
    `;

    console.log('新用戶建立成功：', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('建立用戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 取得所有用戶
export async function getUsers() {
  try {
    const result = await sql`
      SELECT id, username, display_name, email, role, is_active, last_login, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC;
    `;

    return { success: true, data: result.rows };
  } catch (error) {
    console.error('取得用戶列表時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更新用戶資訊
export async function updateUser(userId: number, userData: {
  display_name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}) {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (userData.display_name !== undefined) {
      updateFields.push(`display_name = $${paramIndex}`);
      values.push(userData.display_name);
      paramIndex++;
    }

    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      values.push(userData.email);
      paramIndex++;
    }

    if (userData.role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      values.push(userData.role);
      paramIndex++;
    }

    if (userData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(userData.is_active);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await sql.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, username, display_name, email, role, is_active, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    console.log('用戶更新成功：', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('更新用戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更改用戶密碼
export async function changeUserPassword(userId: number, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id, username;
    `;

    if (result.rows.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    console.log('密碼更新成功：', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('更改密碼時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 刪除用戶
export async function deleteUser(userId: number) {
  try {
    // 先檢查用戶是否存在
    const checkResult = await sql`
      SELECT id, username FROM users WHERE id = ${userId};
    `;

    if (checkResult.rows.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM users WHERE id = ${userId}
      RETURNING id, username;
    `;

    console.log('用戶刪除成功：', result.rows[0]);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('刪除用戶時發生錯誤：', error);
    return { success: false, error: error };
  }
} 