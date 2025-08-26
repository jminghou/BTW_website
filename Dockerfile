# 選擇一個 Node.js 基礎映像檔作為建置環境
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 將 package.json 和 package-lock.json 複製到工作目錄
COPY package*.json ./

# 安裝所有依賴
RUN npm install

# 將所有專案檔案複製到工作目錄
COPY . .

# 建置 Next.js 專案
RUN npm run build

# 暴露容器的 3000 連接埠
EXPOSE 3000

# 啟動 Next.js 伺服器
CMD ["npm", "start"]