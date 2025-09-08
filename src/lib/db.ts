import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// 初始化 Neon 資料庫連線
const sql = neon(process.env.DATABASE_URL!);

/**
 * 資料庫連接工具
 * 使用 Neon Database 提供的 sql 函數來執行 SQL 查詢
 */

// 測試資料庫連接
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('資料庫連接成功！', result[0]);
    return { success: true, data: result[0] };
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

    // 建立年度目標資料表
    await sql`
      CREATE TABLE IF NOT EXISTS annual_goals (
        id SERIAL PRIMARY KEY,
        label VARCHAR(200) NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        target_value INTEGER NOT NULL,
        color VARCHAR(50) NOT NULL DEFAULT 'bg-cyan-500',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 建立公司統計資料表
    await sql`
      CREATE TABLE IF NOT EXISTS company_stats (
        id SERIAL PRIMARY KEY,
        label VARCHAR(200) NOT NULL,
        value VARCHAR(100) NOT NULL,
        trend VARCHAR(50) NOT NULL,
        color VARCHAR(50) NOT NULL DEFAULT 'bg-green-500',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 建立企業客戶資料表
    await sql`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        monthly_orders INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 建立區域資料表
    await sql`
      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        restaurants INTEGER NOT NULL DEFAULT 0,
        orders INTEGER NOT NULL DEFAULT 0,
        revenue VARCHAR(100) NOT NULL,
        design_progress TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 檢查是否有預設管理員，如果沒有則建立
    const existingAdmin = await sql`
      SELECT id FROM users WHERE username = 'admin';
    `;

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('5241', 12);
      await sql`
        INSERT INTO users (username, password_hash, display_name, email, role)
        VALUES ('admin', ${hashedPassword}, '系統管理員', 'admin@btw.com', 'admin');
      `;
      console.log('預設管理員帳號已建立');
    }

    // 檢查是否有預設年度目標，如果沒有則建立範例資料
    const existingGoals = await sql`
      SELECT id FROM annual_goals;
    `;

    if (existingGoals.length === 0) {
      await sql`
        INSERT INTO annual_goals (label, current_value, target_value, color) VALUES
        ('今年營收目標 (員工旅遊門檻)', 35200000, 80000000, 'bg-cyan-500'),
        ('今年活躍用戶數', 34562, 50000, 'bg-gray-500'),
        ('今年新增餐點數', 1230, 3000, 'bg-gray-600');
      `;
      console.log('預設年度目標已建立');
    }

    // 檢查是否有預設公司統計，如果沒有則建立範例資料
    const existingStats = await sql`
      SELECT id FROM company_stats;
    `;

    if (existingStats.length === 0) {
      await sql`
        INSERT INTO company_stats (label, value, trend, color) VALUES
        ('總營業額', 'NT$ 85,200,000', '+12%', 'bg-green-500'),
        ('月訂單數量', '1,234', '+8%', 'bg-blue-500'),
        ('活躍用戶數', '5,678', '+15%', 'bg-cyan-500'),
        ('新增餐點數', '89', '+5%', 'bg-yellow-500');
      `;
      console.log('預設公司統計已建立');
    }

    // 檢查是否有預設企業客戶，如果沒有則建立範例資料
    const existingPartners = await sql`
      SELECT id FROM partners;
    `;

    if (existingPartners.length === 0) {
      await sql`
        INSERT INTO partners (name, category, status, monthly_orders) VALUES
        ('星巴克咖啡', '台北市', 'active', 450),
        ('麥當勞', '新北市', 'active', 680),
        ('肯德基', '桃園市', 'active', 320),
        ('摩斯漢堡', '台中市', 'pending', 250),
        ('漢堡王', '高雄市', 'active', 180),
        ('必勝客', '台南市', 'inactive', 95);
      `;
      console.log('預設企業客戶已建立');
    }

    // 檢查是否有預設區域資料，如果沒有則建立範例資料
    const existingRegions = await sql`
      SELECT id FROM regions;
    `;

    if (existingRegions.length === 0) {
      await sql`
        INSERT INTO regions (name, restaurants, orders, revenue, design_progress) VALUES
        ('台北', 25, 4500, 'NT$ 12,500,000', 'Logo設計:true|Menu設計:true|海報設計:false|包裝設計:true'),
        ('新北', 18, 3200, 'NT$ 8,900,000', 'Logo設計:true|Menu設計:false|海報設計:false|包裝設計:true'),
        ('桃園', 12, 2100, 'NT$ 5,800,000', 'Logo設計:true|Menu設計:true|海報設計:true|包裝設計:false'),
        ('台中', 20, 3800, 'NT$ 10,200,000', 'Logo設計:true|Menu設計:true|海報設計:true|包裝設計:true'),
        ('台南', 15, 2600, 'NT$ 7,100,000', 'Logo設計:false|Menu設計:true|海報設計:false|包裝設計:true'),
        ('高雄', 22, 4100, 'NT$ 11,300,000', 'Logo設計:true|Menu設計:false|海報設計:true|包裝設計:true');
      `;
      console.log('預設區域資料已建立');
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

    console.log('聯絡表單資料儲存成功！', result[0]);
    return { success: true, data: result[0] };
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

    return { success: true, data: result };
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
    
    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的聯絡表單資料' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM contacts WHERE id = ${id}
      RETURNING id;
    `;

    console.log('聯絡表單資料刪除成功！', result[0]);
    return { success: true, data: result[0] };
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

    console.log('電子報訂閱儲存成功！', result[0]);
    return { success: true, data: result[0] };
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

    if (result.length === 0) {
      return { success: false, error: '帳號不存在或已停用' };
    }

    const user = result[0];
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

    if (existingUser.length > 0) {
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

    console.log('新用戶建立成功：', result[0]);
    return { success: true, data: result[0] };
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

    return { success: true, data: result };
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
    // 使用多個條件查詢來處理動態更新
    let result;
    
    if (userData.display_name !== undefined && userData.email !== undefined && userData.role !== undefined && userData.is_active !== undefined) {
      result = await sql`
        UPDATE users SET 
          display_name = ${userData.display_name},
          email = ${userData.email},
          role = ${userData.role},
          is_active = ${userData.is_active},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, display_name, email, role, is_active, updated_at
      `;
    } else if (userData.display_name !== undefined) {
      result = await sql`
        UPDATE users SET 
          display_name = ${userData.display_name},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, display_name, email, role, is_active, updated_at
      `;
    } else if (userData.email !== undefined) {
      result = await sql`
        UPDATE users SET 
          email = ${userData.email},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, display_name, email, role, is_active, updated_at
      `;
    } else if (userData.role !== undefined) {
      result = await sql`
        UPDATE users SET 
          role = ${userData.role},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, display_name, email, role, is_active, updated_at
      `;
    } else if (userData.is_active !== undefined) {
      result = await sql`
        UPDATE users SET 
          is_active = ${userData.is_active},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, display_name, email, role, is_active, updated_at
      `;
    } else {
      return { success: false, error: '沒有提供要更新的資料' };
    }

    if (result.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    console.log('用戶更新成功：', result[0]);
    return { success: true, data: result[0] };
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

    if (result.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    console.log('密碼更新成功：', result[0]);
    return { success: true, data: result[0] };
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

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的用戶' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM users WHERE id = ${userId}
      RETURNING id, username;
    `;

    console.log('用戶刪除成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除用戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// ================== 年度目標管理功能 ==================

// 取得所有年度目標
export async function getAnnualGoals() {
  try {
    const result = await sql`
      SELECT id, label, current_value, target_value, color, 
             ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
             created_at, updated_at
      FROM annual_goals 
      ORDER BY created_at ASC;
    `;

    return { success: true, data: result };
  } catch (error) {
    console.error('取得年度目標時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 建立新的年度目標
export async function createAnnualGoal(goalData: {
  label: string;
  current_value: number;
  target_value: number;
  color: string;
}) {
  try {
    const result = await sql`
      INSERT INTO annual_goals (label, current_value, target_value, color)
      VALUES (${goalData.label}, ${goalData.current_value}, ${goalData.target_value}, ${goalData.color})
      RETURNING id, label, current_value, target_value, color, 
                ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                created_at, updated_at;
    `;

    console.log('年度目標建立成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立年度目標時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更新年度目標
export async function updateAnnualGoal(goalId: number, goalData: {
  label?: string;
  current_value?: number;
  target_value?: number;
  color?: string;
}) {
  try {
    // 先檢查目標是否存在
    const checkResult = await sql`
      SELECT id FROM annual_goals WHERE id = ${goalId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的年度目標' };
    }

    // 使用多個條件來處理動態更新
    let result;
    
    if (goalData.label !== undefined && goalData.current_value !== undefined && 
        goalData.target_value !== undefined && goalData.color !== undefined) {
      result = await sql`
        UPDATE annual_goals SET 
          label = ${goalData.label},
          current_value = ${goalData.current_value},
          target_value = ${goalData.target_value},
          color = ${goalData.color},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${goalId}
        RETURNING id, label, current_value, target_value, color,
                  ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                  updated_at
      `;
    } else if (goalData.label !== undefined) {
      result = await sql`
        UPDATE annual_goals SET 
          label = ${goalData.label},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${goalId}
        RETURNING id, label, current_value, target_value, color,
                  ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                  updated_at
      `;
    } else if (goalData.current_value !== undefined) {
      result = await sql`
        UPDATE annual_goals SET 
          current_value = ${goalData.current_value},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${goalId}
        RETURNING id, label, current_value, target_value, color,
                  ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                  updated_at
      `;
    } else if (goalData.target_value !== undefined) {
      result = await sql`
        UPDATE annual_goals SET 
          target_value = ${goalData.target_value},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${goalId}
        RETURNING id, label, current_value, target_value, color,
                  ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                  updated_at
      `;
    } else if (goalData.color !== undefined) {
      result = await sql`
        UPDATE annual_goals SET 
          color = ${goalData.color},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${goalId}
        RETURNING id, label, current_value, target_value, color,
                  ROUND((current_value::FLOAT / target_value::FLOAT) * 100) as percentage,
                  updated_at
      `;
    } else {
      return { success: false, error: '沒有提供要更新的資料' };
    }

    if (result.length === 0) {
      return { success: false, error: '找不到指定的年度目標' };
    }

    console.log('年度目標更新成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新年度目標時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 刪除年度目標
export async function deleteAnnualGoal(goalId: number) {
  try {
    // 先檢查目標是否存在
    const checkResult = await sql`
      SELECT id, label FROM annual_goals WHERE id = ${goalId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的年度目標' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM annual_goals WHERE id = ${goalId}
      RETURNING id, label;
    `;

    console.log('年度目標刪除成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除年度目標時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// ================== 公司統計管理功能 ==================

// 取得所有公司統計
export async function getCompanyStats() {
  try {
    const result = await sql`
      SELECT id, label, value, trend, color, created_at, updated_at
      FROM company_stats 
      ORDER BY created_at ASC;
    `;

    return { success: true, data: result };
  } catch (error) {
    console.error('取得公司統計時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 建立新的公司統計
export async function createCompanyStat(statData: {
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  try {
    const result = await sql`
      INSERT INTO company_stats (label, value, trend, color)
      VALUES (${statData.label}, ${statData.value}, ${statData.trend}, ${statData.color})
      RETURNING id, label, value, trend, color, created_at, updated_at;
    `;

    console.log('公司統計建立成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立公司統計時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更新公司統計
export async function updateCompanyStat(statId: number, statData: {
  label?: string;
  value?: string;
  trend?: string;
  color?: string;
}) {
  try {
    // 先檢查統計是否存在
    const checkResult = await sql`
      SELECT id FROM company_stats WHERE id = ${statId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的公司統計' };
    }

    // 使用多個條件來處理動態更新
    let result;
    
    if (statData.label !== undefined && statData.value !== undefined && 
        statData.trend !== undefined && statData.color !== undefined) {
      result = await sql`
        UPDATE company_stats SET 
          label = ${statData.label},
          value = ${statData.value},
          trend = ${statData.trend},
          color = ${statData.color},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statId}
        RETURNING id, label, value, trend, color, updated_at
      `;
    } else if (statData.label !== undefined) {
      result = await sql`
        UPDATE company_stats SET 
          label = ${statData.label},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statId}
        RETURNING id, label, value, trend, color, updated_at
      `;
    } else if (statData.value !== undefined) {
      result = await sql`
        UPDATE company_stats SET 
          value = ${statData.value},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statId}
        RETURNING id, label, value, trend, color, updated_at
      `;
    } else if (statData.trend !== undefined) {
      result = await sql`
        UPDATE company_stats SET 
          trend = ${statData.trend},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statId}
        RETURNING id, label, value, trend, color, updated_at
      `;
    } else if (statData.color !== undefined) {
      result = await sql`
        UPDATE company_stats SET 
          color = ${statData.color},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${statId}
        RETURNING id, label, value, trend, color, updated_at
      `;
    } else {
      return { success: false, error: '沒有提供要更新的資料' };
    }

    if (result.length === 0) {
      return { success: false, error: '找不到指定的公司統計' };
    }

    console.log('公司統計更新成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新公司統計時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 刪除公司統計
export async function deleteCompanyStat(statId: number) {
  try {
    // 先檢查統計是否存在
    const checkResult = await sql`
      SELECT id, label FROM company_stats WHERE id = ${statId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的公司統計' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM company_stats WHERE id = ${statId}
      RETURNING id, label;
    `;

    console.log('公司統計刪除成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除公司統計時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// ================== 企業客戶管理功能 ==================

// 取得所有企業客戶
export async function getPartners() {
  try {
    const result = await sql`
      SELECT id, name, category, status, monthly_orders, created_at, updated_at
      FROM partners 
      ORDER BY created_at ASC;
    `;

    return { success: true, data: result };
  } catch (error) {
    console.error('取得企業客戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 建立新的企業客戶
export async function createPartner(partnerData: {
  name: string;
  category: string;
  status: string;
  monthly_orders: number;
}) {
  try {
    const result = await sql`
      INSERT INTO partners (name, category, status, monthly_orders)
      VALUES (${partnerData.name}, ${partnerData.category}, ${partnerData.status}, ${partnerData.monthly_orders})
      RETURNING id, name, category, status, monthly_orders, created_at, updated_at;
    `;

    console.log('企業客戶建立成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立企業客戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更新企業客戶
export async function updatePartner(partnerId: number, partnerData: {
  name?: string;
  category?: string;
  status?: string;
  monthly_orders?: number;
}) {
  try {
    // 先檢查客戶是否存在
    const checkResult = await sql`
      SELECT id FROM partners WHERE id = ${partnerId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的企業客戶' };
    }

    // 使用多個條件來處理動態更新
    let result;
    
    if (partnerData.name !== undefined && partnerData.category !== undefined && 
        partnerData.status !== undefined && partnerData.monthly_orders !== undefined) {
      result = await sql`
        UPDATE partners SET 
          name = ${partnerData.name},
          category = ${partnerData.category},
          status = ${partnerData.status},
          monthly_orders = ${partnerData.monthly_orders},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${partnerId}
        RETURNING id, name, category, status, monthly_orders, updated_at
      `;
    } else if (partnerData.name !== undefined) {
      result = await sql`
        UPDATE partners SET 
          name = ${partnerData.name},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${partnerId}
        RETURNING id, name, category, status, monthly_orders, updated_at
      `;
    } else if (partnerData.category !== undefined) {
      result = await sql`
        UPDATE partners SET 
          category = ${partnerData.category},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${partnerId}
        RETURNING id, name, category, status, monthly_orders, updated_at
      `;
    } else if (partnerData.status !== undefined) {
      result = await sql`
        UPDATE partners SET 
          status = ${partnerData.status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${partnerId}
        RETURNING id, name, category, status, monthly_orders, updated_at
      `;
    } else if (partnerData.monthly_orders !== undefined) {
      result = await sql`
        UPDATE partners SET 
          monthly_orders = ${partnerData.monthly_orders},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${partnerId}
        RETURNING id, name, category, status, monthly_orders, updated_at
      `;
    } else {
      return { success: false, error: '沒有提供要更新的資料' };
    }

    if (result.length === 0) {
      return { success: false, error: '找不到指定的企業客戶' };
    }

    console.log('企業客戶更新成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新企業客戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 刪除企業客戶
export async function deletePartner(partnerId: number) {
  try {
    // 先檢查客戶是否存在
    const checkResult = await sql`
      SELECT id, name FROM partners WHERE id = ${partnerId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的企業客戶' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM partners WHERE id = ${partnerId}
      RETURNING id, name;
    `;

    console.log('企業客戶刪除成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除企業客戶時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// ================== 區域資料管理功能 ==================

// 取得所有區域資料
export async function getRegions() {
  try {
    const result = await sql`
      SELECT id, name, restaurants, orders, revenue, design_progress, created_at, updated_at
      FROM regions 
      ORDER BY created_at ASC;
    `;

    return { success: true, data: result };
  } catch (error) {
    console.error('取得區域資料時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 建立新的區域資料
export async function createRegion(regionData: {
  name: string;
  restaurants: number;
  orders: number;
  revenue: string;
  design_progress: string;
}) {
  try {
    const result = await sql`
      INSERT INTO regions (name, restaurants, orders, revenue, design_progress)
      VALUES (${regionData.name}, ${regionData.restaurants}, ${regionData.orders}, ${regionData.revenue}, ${regionData.design_progress})
      RETURNING id, name, restaurants, orders, revenue, design_progress, created_at, updated_at;
    `;

    console.log('區域資料建立成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('建立區域資料時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 更新區域資料
export async function updateRegion(regionId: number, regionData: {
  name?: string;
  restaurants?: number;
  orders?: number;
  revenue?: string;
  design_progress?: string;
}) {
  try {
    // 先檢查區域是否存在
    const checkResult = await sql`
      SELECT id FROM regions WHERE id = ${regionId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的區域資料' };
    }

    // 使用多個條件來處理動態更新
    let result;
    
    if (regionData.name !== undefined && regionData.restaurants !== undefined && 
        regionData.orders !== undefined && regionData.revenue !== undefined && 
        regionData.design_progress !== undefined) {
      result = await sql`
        UPDATE regions SET 
          name = ${regionData.name},
          restaurants = ${regionData.restaurants},
          orders = ${regionData.orders},
          revenue = ${regionData.revenue},
          design_progress = ${regionData.design_progress},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else if (regionData.name !== undefined) {
      result = await sql`
        UPDATE regions SET 
          name = ${regionData.name},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else if (regionData.restaurants !== undefined) {
      result = await sql`
        UPDATE regions SET 
          restaurants = ${regionData.restaurants},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else if (regionData.orders !== undefined) {
      result = await sql`
        UPDATE regions SET 
          orders = ${regionData.orders},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else if (regionData.revenue !== undefined) {
      result = await sql`
        UPDATE regions SET 
          revenue = ${regionData.revenue},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else if (regionData.design_progress !== undefined) {
      result = await sql`
        UPDATE regions SET 
          design_progress = ${regionData.design_progress},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${regionId}
        RETURNING id, name, restaurants, orders, revenue, design_progress, updated_at
      `;
    } else {
      return { success: false, error: '沒有提供要更新的資料' };
    }

    if (result.length === 0) {
      return { success: false, error: '找不到指定的區域資料' };
    }

    console.log('區域資料更新成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('更新區域資料時發生錯誤：', error);
    return { success: false, error: error };
  }
}

// 刪除區域資料
export async function deleteRegion(regionId: number) {
  try {
    // 先檢查區域是否存在
    const checkResult = await sql`
      SELECT id, name FROM regions WHERE id = ${regionId};
    `;

    if (checkResult.length === 0) {
      return { success: false, error: '找不到指定的區域資料' };
    }

    // 執行刪除
    const result = await sql`
      DELETE FROM regions WHERE id = ${regionId}
      RETURNING id, name;
    `;

    console.log('區域資料刪除成功：', result[0]);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('刪除區域資料時發生錯誤：', error);
    return { success: false, error: error };
  }
} 