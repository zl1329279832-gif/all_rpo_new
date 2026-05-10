# 服务器资源监控与告警管理系统

Server Resource Monitoring and Alert Management System

## 项目概述

本系统是一个企业级服务器资源监控与告警管理平台，采用前后端分离架构。后端使用 Java Spring Boot 3 + Spring Security + JWT + Redis，前端使用 Vue 3 + ECharts + Element Plus。

### 功能特性

- **用户权限管理**: 支持三种角色（ADMIN/OPERATOR/VIEWER），基于 JWT 的无状态认证
- **服务器信息管理**: 服务器的增删改查，支持自动注册
- **监控指标上报**: CPU/内存/磁盘/网络指标实时上报
- **告警规则配置**: 灵活的阈值规则配置，支持全局和服务器级别
- **告警记录查询**: 告警记录查看、确认、处理和级别调整
- **监控看板展示**: 使用 ECharts 展示实时监控图表

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2.0
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0
- Redis
- Maven

### 前端
- Vue 3.4
- Vue Router 4
- Pinia 状态管理
- Element Plus UI
- ECharts 5
- Axios
- Vite 5

## 项目结构

```
r28/
├── backend/                    # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/monitor/
│   │       │   ├── ServerMonitorApplication.java
│   │       │   ├── config/        # 配置类(Security, Redis, 异常处理)
│   │       │   ├── controller/    # REST 控制器
│   │       │   ├── dto/           # 数据传输对象
│   │       │   ├── entity/        # JPA 实体
│   │       │   ├── repository/    # 数据访问层
│   │       │   ├── security/      # JWT 安全组件
│   │       │   └── service/       # 业务逻辑层
│   │       └── resources/
│   │           └── application.yml
│   └── pom.xml
├── frontend/                   # Vue 3 前端
│   ├── src/
│   │   ├── api/                # API 接口定义
│   │   ├── layouts/            # 布局组件
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── styles/             # 全局样式
│   │   ├── utils/              # 工具函数(axios封装)
│   │   ├── views/              # 页面组件
│   │   │   ├── Dashboard.vue   # 监控看板
│   │   │   ├── Login.vue       # 登录页
│   │   │   ├── Servers.vue     # 服务器管理
│   │   │   ├── ServerDetail.vue # 服务器详情
│   │   │   ├── Alerts.vue      # 告警记录
│   │   │   ├── AlertRules.vue  # 告警规则
│   │   │   └── Users.vue       # 用户管理
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql              # 数据库初始化脚本
└── README.md
```

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 5.0+
- Maven 3.6+

### 1. 初始化数据库

```bash
# 进入MySQL客户端
mysql -u root -p

# 执行初始化脚本
source database/schema.sql
```

默认创建的管理员账号：
- 用户名: `admin`
- 密码: `admin123`

**注意**: 数据库中默认密码为占位符，请先运行后端生成正确的 BCrypt 密码再手动更新，或使用以下步骤：

1. 修改 `application.yml` 中的数据库连接信息
2. 运行后端服务后，使用以下 SQL 更新管理员密码（需要先生成 BCrypt 加密后的密码）：

```sql
UPDATE users SET password = 'BCRYPT_ENCRYPTED_PASSWORD' WHERE username = 'admin';
```

### 2. 配置后端

编辑 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/monitor_system?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
  
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password  # 没有密码留空
```

### 3. 启动后端服务

```bash
cd backend

# Maven 构建
mvn clean package

# 运行
mvn spring-boot:run

# 或运行打包后的 Jar
java -jar target/server-monitor-1.0.0.jar
```

服务启动后访问: http://localhost:8080

### 4. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产构建
npm run build
```

前端访问地址: http://localhost:5173

## 核心 API 接口

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 公开 |

### 服务器接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/servers` | 获取服务器列表 | 登录 |
| GET | `/api/servers/{id}` | 获取服务器详情 | 登录 |
| POST | `/api/servers` | 添加服务器 | ADMIN/OPERATOR |
| PUT | `/api/servers/{id}` | 更新服务器 | ADMIN/OPERATOR |
| DELETE | `/api/servers/{id}` | 删除服务器 | ADMIN/OPERATOR |

### 指标接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/metrics/report` | 上报监控指标 | 公开(agent使用) |
| GET | `/api/metrics/server/{id}` | 获取服务器指标历史 | 登录 |
| GET | `/api/metrics/server/{id}/range` | 按时间范围获取指标 | 登录 |
| GET | `/api/metrics/server/{id}/latest` | 获取最新指标 | 登录 |

### 告警接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/alerts` | 获取活跃告警 | 登录 |
| GET | `/api/alerts/stats` | 获取告警统计 | 登录 |
| GET | `/api/alerts/status/{status}` | 按状态获取告警 | 登录 |
| POST | `/api/alerts/{id}/acknowledge` | 确认告警 | ADMIN/OPERATOR |
| POST | `/api/alerts/{id}/resolve` | 标记已处理 | ADMIN/OPERATOR |
| PUT | `/api/alerts/{id}/level` | 调整告警级别 | ADMIN/OPERATOR |
| GET | `/api/alerts/rules` | 获取告警规则 | 登录 |
| POST | `/api/alerts/rules` | 创建规则 | ADMIN/OPERATOR |
| PUT | `/api/alerts/rules/{id}` | 更新规则 | ADMIN/OPERATOR |
| DELETE | `/api/alerts/rules/{id}` | 删除规则 | ADMIN/OPERATOR |

### 用户接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | ADMIN |
| POST | `/api/users` | 创建用户 | ADMIN |
| PUT | `/api/users/{id}` | 更新用户 | ADMIN |
| DELETE | `/api/users/{id}` | 删除用户 | ADMIN |

## 指标上报示例

被监控服务器需要定期向系统上报指标数据。上报接口为公开接口，无需认证。

### 上报请求示例

```json
POST /api/metrics/report
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "hostname": "prod-server-01",
  "osType": "Linux",
  "osVersion": "CentOS 7",
  "cpuCores": 8,
  "totalMemoryGb": 32,
  "totalDiskGb": 500,
  "cpuUsage": 65.5,
  "memoryUsage": 72.3,
  "memoryUsedGb": 23.14,
  "diskUsage": 45.2,
  "diskUsedGb": 226.0,
  "networkInMbps": 125.5,
  "networkOutMbps": 89.3,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 简单的上报脚本 (Python 示例)

```python
import psutil
import requests
import time
from datetime import datetime

API_URL = "http://localhost:8080/api/metrics/report"
IP_ADDRESS = "192.168.1.100"

def get_metrics():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    network = psutil.net_io_counters()
    
    return {
        "ipAddress": IP_ADDRESS,
        "hostname": "prod-server-01",
        "osType": "Linux",
        "cpuUsage": cpu,
        "memoryUsage": memory.percent,
        "memoryUsedGb": round(memory.used / (1024**3), 2),
        "diskUsage": disk.percent,
        "diskUsedGb": round(disk.used / (1024**3), 2),
        "networkInMbps": round(network.bytes_recv / (1024**2 * 60), 2),
        "networkOutMbps": round(network.bytes_sent / (1024**2 * 60), 2)
    }

while True:
    metrics = get_metrics()
    try:
        requests.post(API_URL, json=metrics, timeout=5)
        print(f"Reported: CPU={metrics['cpuUsage']}% Memory={metrics['memoryUsage']}%")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(60)
```

## 数据库表结构

### 主要表

1. **roles** - 角色表
   - id, name, description, created_at, updated_at

2. **users** - 用户表
   - id, username, password, email, real_name, role_id, enabled, created_at, updated_at

3. **servers** - 服务器信息表
   - id, name, ip_address, hostname, os_type, os_version, cpu_cores, 
     total_memory_gb, total_disk_gb, status, last_heartbeat, description

4. **metrics** - 监控指标表
   - id, server_id, cpu_usage, memory_usage, memory_used_gb, 
     disk_usage, disk_used_gb, network_in_mbps, network_out_mbps, timestamp

5. **alert_rules** - 告警规则表
   - id, name, server_id, metric_type, operator, threshold, 
     alert_level, description, enabled, silenced

6. **alerts** - 告警记录表
   - id, rule_id, server_id, metric_type, current_value, threshold_value,
     alert_level, message, status, acknowledged_by, acknowledged_at, 
     resolved_at, occurred_at

## 角色权限说明

| 角色 | 权限 |
|------|------|
| ADMIN | 全部权限，包括用户管理 |
| OPERATOR | 服务器管理、告警管理，但不能管理用户 |
| VIEWER | 只读权限，只能查看监控数据 |

## 生产环境部署

### 后端部署

```bash
# 1. 构建生产包
cd backend
mvn clean package -DskipTests

# 2. 复制 jar 到部署目录
cp target/server-monitor-1.0.0.jar /opt/monitor/

# 3. 使用 systemd 管理服务
sudo vi /etc/systemd/system/monitor-server.service
```

systemd 配置示例:

```ini
[Unit]
Description=Server Monitor Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=monitor
ExecStart=/usr/bin/java -jar /opt/monitor/server-monitor-1.0.0.jar
WorkingDirectory=/opt/monitor
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitor-server
sudo systemctl start monitor-server
```

### 前端部署

```bash
# 1. 构建生产版本
cd frontend
npm run build

# 2. 将 dist 目录部署到 Nginx
cp -r dist/* /usr/share/nginx/html/monitor/
```

Nginx 配置示例:

```nginx
server {
    listen 80;
    server_name monitor.example.com;
    
    # 前端静态资源
    root /usr/share/nginx/html/monitor;
    index index.html;
    
    # 前端路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 安全建议

1. **修改默认密码**: 首次部署后立即修改 admin 账号密码
2. **配置 HTTPS**: 生产环境必须使用 HTTPS
3. **数据库密码**: 不要使用明文密码，可使用环境变量或加密配置
4. **JWT 密钥**: 修改 `application.yml` 中的 `jwt.secret` 为随机长字符串
5. **Redis 密码**: 生产环境 Redis 必须设置密码
6. **网络隔离**: 指标上报接口建议在内网使用
7. **定期备份**: 配置数据库定时备份任务

## 常见问题

### 1. 登录失败，密码不匹配

数据库初始化脚本中的密码是占位符。需要：
1. 启动后端服务
2. 使用 BCrypt 工具生成 `admin123` 的加密密码
3. 更新数据库中的密码字段

### 2. 前端 API 请求跨域

开发环境通过 Vite proxy 配置已处理。生产环境使用 Nginx 代理或配置后端 CORS。

### 3. Redis 连接失败

确保 Redis 服务已启动，或修改 `application.yml` 中的 Redis 配置。

### 4. 中文乱码

MySQL 连接字符串需添加 `useUnicode=true&characterEncoding=UTF-8`

## 许可证

MIT License
