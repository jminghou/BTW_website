# 📚 資料庫管理指南

## 🔐 登入管理介面

### 管理頁面位置
```
開發環境：http://localhost:3000/admin
正式環境：https://您的網域名稱.com/admin
```

## ⚙️ 環境變數設定

您需要建立 `.env.local` 檔案並加入以下 Vercel Postgres 連接資訊：

```env
# Vercel Postgres 資料庫連接設定
POSTGRES_URL="postgres://username:password@hostname:port/database"
POSTGRES_PRISMA_URL="postgres://username:password@hostname:port/database?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://username:password@hostname:port/database"
POSTGRES_USER="your_username"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="your_database"
```

### 🔍 如何取得 Vercel Postgres 連接資訊

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 進入您的專案
3. 點選 "Storage" 標籤
4. 選擇您的 Postgres 資料庫
5. 複製提供的環境變數到 `.env.local` 檔案中

## 🛠️ 管理功能說明

### 1. 測試資料庫連接
- **用途**：檢查資料庫連接是否正常
- **按鈕**：藍色「測試資料庫連接」
- **結果**：顯示連接狀態和當前時間

### 2. 初始化資料庫表格
- **用途**：建立必要的資料表（users、contacts、newsletter_subscriptions）
- **按鈕**：綠色「初始化資料庫表格」
- **注意**：首次使用前必須執行此步驟，會自動建立預設管理員帳號（admin/5241）

### 3. 查看聯絡表單資料
- **用途**：顯示所有提交的聯絡表單
- **按鈕**：紫色「查看聯絡表單資料」
- **內容**：包含姓名、email、訊息、提交時間等

### 4. 用戶身份管理
- **用途**：管理系統登入用戶的帳號和權限
- **功能**：
  - 新增用戶帳號
  - 編輯用戶資訊
  - 更改用戶密碼
  - 啟用/停用帳號
  - 刪除用戶
  - 查看登入紀錄

## 📊 資料表結構

### users 表格（用戶身份管理）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵，自動遞增 |
| username | VARCHAR(50) | 用戶名（唯一） |
| password_hash | VARCHAR(255) | 加密後的密碼 |
| display_name | VARCHAR(100) | 顯示名稱 |
| email | VARCHAR(255) | 電子信箱（唯一） |
| role | VARCHAR(20) | 用戶角色（admin/editor/viewer） |
| is_active | BOOLEAN | 是否啟用 |
| last_login | TIMESTAMP | 最後登入時間 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

### contacts 表格
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵，自動遞增 |
| identity | VARCHAR(50) | 身份類別 |
| user_name | VARCHAR(100) | 使用者姓名 |
| title | VARCHAR(200) | 主旨 |
| user_email | VARCHAR(255) | 電子信箱 |
| phone | VARCHAR(20) | 電話號碼 |
| message | TEXT | 訊息內容 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

### newsletter_subscriptions 表格
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵，自動遞增 |
| email | VARCHAR(255) | 電子信箱（唯一） |
| name | VARCHAR(100) | 姓名 |
| is_active | BOOLEAN | 是否啟用 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

## 🚀 開始使用步驟

1. **設定環境變數**
   - 建立 `.env.local` 檔案
   - 加入 Vercel Postgres 連接資訊

2. **測試連接**
   - 進入 `/admin` 頁面
   - 點選「測試資料庫連接」
   - 確認連接成功

3. **初始化資料庫**
   - 點選「初始化資料庫表格」
   - 等待表格建立完成

4. **查看資料**
   - 點選「查看聯絡表單資料」
   - 檢視目前所有的聯絡表單提交記錄

5. **管理用戶帳號**
   - 進入「用戶管理」頁面
   - 可新增、編輯、刪除用戶帳號
   - 預設管理員：admin / 5241

## ⚠️ 注意事項

- 確保 `.env.local` 檔案不要提交到版本控制系統
- 初始化資料庫表格只需執行一次
- 如果遇到連接問題，請檢查環境變數設定
- 建議定期備份重要資料 