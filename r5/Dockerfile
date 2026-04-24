# 构建阶段 - 使用 Node.js Windows 镜像
FROM node:20-windowsservercore-ltsc2022 AS builder

WORKDIR C:/app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com

RUN npm install

COPY . .

RUN npm run build

# 运行阶段 - 使用轻量的 Node.js Windows 镜像运行静态文件服务器
FROM node:20-windowsservercore-ltsc2022

WORKDIR C:/app

# 全局安装 serve 静态文件服务器
RUN npm install -g serve --registry=https://registry.npmmirror.com

# 从构建阶段复制构建产物
COPY --from=builder C:/app/dist C:/app/dist

# 暴露端口
EXPOSE 3000

# 启动静态文件服务器
CMD ["serve", "-s", "dist", "-l", "3000"]
