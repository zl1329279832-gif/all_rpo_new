# ============================================================
# 前端项目 Dockerfile (Windows 容器)
# 多阶段构建：构建阶段 + 运行阶段
# ============================================================

# ============================================================
# 第一阶段：构建阶段 - 使用 Node 镜像构建前端项目
# ============================================================
FROM mcr.microsoft.com/windows/servercore:ltsc2022 AS build-env

# 设置工作目录
WORKDIR /app

# 设置 Node.js 环境变量
ENV NODE_VERSION=20.19.0

# 下载并安装 Node.js
RUN powershell -Command `
    $ProgressPreference = 'SilentlyContinue'; `
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v${env:NODE_VERSION}/node-v${env:NODE_VERSION}-win-x64.zip" -OutFile "node.zip"; `
    Expand-Archive -Path "node.zip" -DestinationPath "C:\"; `
    Remove-Item "node.zip"; `
    $env:PATH = "C:\node-v${env:NODE_VERSION}-win-x64;${env:PATH}"; `
    [Environment]::SetEnvironmentVariable('PATH', "C:\node-v${env:NODE_VERSION}-win-x64;${env:PATH}", 'Machine')

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN powershell -Command `
    $env:PATH = "C:\node-v20.19.0-win-x64;${env:PATH}"; `
    npm install

# 复制所有源代码
COPY . .

# 构建生产版本
RUN powershell -Command `
    $env:PATH = "C:\node-v20.19.0-win-x64;${env:PATH}"; `
    npm run build

# ============================================================
# 第二阶段：运行阶段 - 使用 Nginx 镜像提供静态文件
# ============================================================
FROM nginx:1.25

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 从构建阶段复制构建产物
COPY --from=build-env /app/dist .

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
