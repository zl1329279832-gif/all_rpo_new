# Docker 部署指南

本文档介绍如何使用 Docker 和 Docker Compose 一键部署服务器资源监控与告警管理系统。

## 环境要求

- Windows 10/11 (WSL2 推荐) 或 Windows Server 2019+
- Docker Desktop for Windows 4.0+
- Docker Compose V2 (随 Docker Desktop 一起安装)
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

## 快速开始

### 1. 确认 Docker 已安装

```powershell
docker --version
docker compose version
```

### 2. 一键启动所有服务

在项目根目录（包含 `docker-compose.yml` 的目录）执行：

```powershell
docker compose up -d --build
```

### 3. 等待服务启动

首次启动需要下载镜像和构建应用，请耐心等待（约 5-10 分钟）。

查看服务状态：

```powershell
docker compose ps
```

### 4. 访问系统

服务全部启动后，访问：

- **前端**: http://localhost/
- **后端 API**: http://localhost:8080/

默认登录账号：
- 用户名: `admin`
- 密码: `admin123`

## 常用命令

### 启动服务

```powershell
# 首次启动（包含构建）
docker compose up -d --build

# 仅启动，不重新构建
docker compose up -d
```

### 停止服务

```powershell
docker compose down
```

### 停止服务并删除数据（慎用）

```powershell
docker compose down -v
```

### 查看日志

```powershell
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose logs -f redis
```

### 重启服务

```powershell
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

## 服务说明

| 服务名 | 容器名 | 端口 | 镜像/源码 | 说明 |
|--------|--------|------|-----------|------|
| mysql | monitor-mysql | 3307:3306 | mysql:8.0 | 数据库 |
| redis | monitor-redis | 6379:6379 | redis:7-alpine | 缓存 |
| backend | monitor-backend | 8080:8080 | 源码构建 | Spring Boot 后端 |
| frontend | monitor-frontend | 80:80 | 源码构建 | Vue 3 + Nginx 前端 |

## 配置说明

所有配置通过 `.env` 文件管理：

```env
# MySQL 配置
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=monitor_system
MYSQL_PORT=3307

# Redis 配置
REDIS_PASSWORD=
REDIS_PORT=6379

# 应用端口
BACKEND_PORT=8080
FRONTEND_PORT=80

# JWT 配置（生产环境必须修改！）
JWT_SECRET=monitor-system-jwt-secret-key-2024-production-change-me
JWT_EXPIRATION=86400000
```

### 生产环境配置建议

1. **修改 JWT 密钥**：
   ```env
   JWT_SECRET=你的随机长字符串（至少32个字符）
   ```

2. **设置 Redis 密码**：
   ```env
   REDIS_PASSWORD=你的Redis密码
   ```

3. **修改 MySQL 密码**：
   ```env
   MYSQL_ROOT_PASSWORD=你的强密码
   ```

## 数据持久化

数据存储在 Docker Volume 中，不会因容器重启丢失：

| Volume | 用途 |
|--------|------|
| mysql_data | MySQL 数据库文件 |
| redis_data | Redis 数据文件 |

### 备份数据库

```powershell
# 导出数据库
docker exec monitor-mysql mysqldump -uroot -proot123 monitor_system > backup.sql

# 导入数据库
docker exec -i monitor-mysql mysql -uroot -proot123 monitor_system < backup.sql
```

## 目录结构

```
r28/
├── backend/
│   ├── Dockerfile           # 后端 Dockerfile
│   ├── .dockerignore        # 后端构建忽略文件
│   ├── pom.xml              # Maven 配置
│   └── src/                 # Java 源代码
├── frontend/
│   ├── Dockerfile           # 前端 Dockerfile
│   ├── .dockerignore        # 前端构建忽略文件
│   ├── nginx.conf           # Nginx 配置
│   ├── package.json         # npm 依赖
│   └── src/                 # Vue 源代码
├── database/
│   └── schema.sql           # 数据库初始化脚本
├── agent/
│   └── monitor_agent_v2.py  # 采集 Agent
├── docker-compose.yml       # Docker Compose 配置
├── .env                     # 环境变量
├── README_DOCKER.md         # 本文档
└── README.md                # 项目总览
```

## 容器网络

所有容器都在 `monitor-network` 网络中：

```
frontend (Nginx :80)
    │
    ├── 静态文件 / -> 本地
    └── API /api/* -> backend:8080/api/*
         │
         v
    backend (Spring Boot :8080)
         │
         ├── MySQL (mysql:3306)
         └── Redis (redis:6379)
```

## 常见问题

### 1. 端口被占用

如果 `80` 或 `8080` 端口被占用，修改 `.env`：

```env
BACKEND_PORT=8081
FRONTEND_PORT=8080
```

### 2. 后端无法连接 MySQL

确保 MySQL 已启动并健康：

```powershell
docker compose logs mysql
docker compose ps
```

### 3. 构建速度太慢

使用国内镜像源加速（已在 Dockerfile 中配置）：

- Maven: 本地缓存（通过多阶段构建优化）
- npm: 使用 `registry.npmmirror.com`

### 4. 清除所有镜像和容器（完全重装）

```powershell
# 停止并删除容器
docker compose down -v

# 删除镜像
docker rmi r28-backend r28-frontend mysql:8.0 redis:7-alpine

# 重新构建并启动
docker compose up -d --build
```

### 5. 内存不足

如果 Docker 内存不足，在 Docker Desktop 设置中增加内存（建议 4GB+）：

Settings → Resources → Advanced → Memory

### 6. Windows 换行符问题

如果出现 `^M` 或换行符相关错误：

```powershell
# 确保 Git 配置正确
git config --global core.autocrlf input
```

## 生产部署建议

### 1. 使用 HTTPS

在 Nginx 中配置 SSL 证书，修改 `frontend/nginx.conf`：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... 其他配置
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 防火墙配置

```powershell
# Windows 防火墙开放端口
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Backend" dir=in action=allow protocol=TCP localport=8080
```

### 3. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Agent 配置

在目标服务器上部署采集 Agent：

1. 修改 `agent/config.json` 中的 `server_url`：

```json
{
  "server_url": "http://你的监控服务器IP:8080",
  "report_interval": 30
}
```

2. 安装依赖并运行：

```bash
pip install -r requirements.txt
python monitor_agent_v2.py
```

详细说明请参考 `agent/README_AGENT.md`。

## License

MIT License
