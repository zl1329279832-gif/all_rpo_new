# 聊天室系统部署运行指南

## 系统要求

### 后端环境
- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+

### 前端环境
- Node.js 18+
- npm 9+

## 快速开始

### 第一步：准备数据库

1. 创建 MySQL 数据库
```sql
CREATE DATABASE chat_room DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行初始化脚本
脚本位置：`chat-server/src/main/resources/db/init.sql`

```bash
# 方式一：在 MySQL 命令行执行
mysql -u root -p chat_room < chat-server/src/main/resources/db/init.sql

# 方式二：使用 Navicat、DataGrip 等工具导入
```

3. 修改数据库连接配置
编辑 `chat-server/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chat_room?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root      # 改为你的 MySQL 用户名
    password: root      # 改为你的 MySQL 密码
  data:
    redis:
      host: localhost
      port: 6379
      password:         # 如果 Redis 有密码，填写这里
```

### 第二步：启动后端服务

1. 进入后端目录
```bash
cd chat-server
```

2. 安装依赖并启动
```bash
# 方式一：使用 Maven 命令
mvn spring-boot:run

# 方式二：先编译再运行
mvn clean package -DskipTests
java -jar target/chat-server-1.0.0.jar
```

后端服务启动后，访问地址：
- API 接口：`http://localhost:8080`
- WebSocket：`ws://localhost:8080/ws/chat`

### 第三步：启动前端服务

1. 进入前端目录
```bash
cd chat-client
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

前端服务启动后，访问地址：`http://localhost:3000`

## 测试账号

初始化脚本中已创建以下测试用户：

| 用户名 | 密码 | 昵称 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 群主，有两个测试群 |
| user1 | 123456 | 用户一 | 普通用户 |
| user2 | 123456 | 用户二 | 普通用户 |
| user3 | 123456 | 用户三 | 普通用户 |

### 测试好友关系
- admin ↔ user1（互为好友）
- admin ↔ user2（互为好友）
- user1 ↔ user2（互为好友）

### 测试群组
| 群组名称 | 群主 | 成员 |
|----------|------|------|
| 技术交流群 | admin | admin, user1, user2, user3 |
| 好友群 | user1 | user1, admin, user2 |

## 功能测试步骤

### 1. 用户登录
1. 打开 `http://localhost:3000`
2. 如果未登录，会自动跳转到登录页
3. 输入用户名 `admin`，密码 `123456`
4. 点击登录，成功后进入聊天室首页

### 2. 多用户实时聊天测试

**准备工作**：
- 浏览器 A：登录 `admin`
- 浏览器 B：登录 `user1`
- 或者使用同一个浏览器的隐私窗口

**私聊测试**：
1. 在浏览器 A（admin）点击左侧"联系人"标签
2. 在好友列表中找到"用户一"，点击头像开始聊天
3. 在输入框输入消息，按 Ctrl+Enter 或点击发送按钮
4. 在浏览器 B（user1）查看消息是否实时收到
5. 在浏览器 B 回复消息，查看浏览器 A 是否收到

**群聊测试**：
1. 在浏览器 A（admin）点击左侧"联系人"标签
2. 在群组列表中找到"技术交流群"，点击开始群聊
3. 发送一条消息
4. 在浏览器 B（user1）查看群聊消息是否收到

### 3. 未读消息测试
1. 在浏览器 A（admin）给 user1 发送多条消息
2. 此时浏览器 B（user1）未打开与 admin 的聊天窗口
3. 观察浏览器 B 的消息列表中，admin 的会话是否显示未读角标
4. 在浏览器 B 点击 admin 的会话，进入聊天窗口
5. 观察未读角标是否消失

### 4. 在线状态测试
1. 浏览器 A 登录 admin，浏览器 B 登录 user1
2. 双方都在联系人列表中观察对方的在线状态（绿色圆点）
3. 关闭浏览器 B（user1 下线）
4. 观察浏览器 A 中 user1 的在线状态是否变为离线（灰色圆点）

### 5. 好友申请测试
1. 浏览器 A 登录 user3
2. 点击联系人列表右上角的加号按钮（添加好友）
3. 在搜索框输入 `user1` 或 `user2`，点击搜索
4. 找到用户后点击"添加"按钮
5. 浏览器 B 登录 user1，查看好友申请列表
6. 点击"接受"或"拒绝"
7. 观察双方好友列表是否更新

### 6. 群组管理测试
**创建群组**：
1. 登录 admin
2. 点击联系人列表右上角的加号按钮（创建群组）
3. 输入群名称，选择群成员
4. 点击创建，观察群组列表是否更新

**添加群成员**：
1. 登录 admin（群主）
2. 点击群聊窗口右上角的"群成员"按钮
3. （当前版本需要通过 API 添加，可使用 API 测试工具）

## 生产环境部署

### 后端部署

1. 编译打包
```bash
cd chat-server
mvn clean package -DskipTests
```

2. 运行 Jar 包
```bash
nohup java -jar chat-server-1.0.0.jar \
  --spring.datasource.username=your_username \
  --spring.datasource.password=your_password \
  --spring.data.redis.password=your_redis_password \
  > app.log 2>&1 &
```

### 前端部署

1. 构建生产版本
```bash
cd chat-client
npm run build
```

2. 部署到 Nginx
将 `dist` 目录复制到 Nginx 静态资源目录，并配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态资源
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket 反向代理
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否启动
- 检查用户名密码是否正确
- 检查数据库 `chat_room` 是否创建

### 2. Redis 连接失败
- 检查 Redis 服务是否启动
- 检查端口是否正确（默认 6379）
- 检查是否需要密码认证

### 3. 前端无法访问后端 API
- 检查后端服务是否启动（端口 8080）
- 检查前端代理配置（vite.config.ts）
- 确认没有跨域问题

### 4. WebSocket 连接失败
- 检查 Token 是否有效
- 检查 WebSocket 连接地址格式
- 确认后端 WebSocket 服务已启动

### 5. 消息不实时推送
- 检查 WebSocket 连接状态
- 检查用户是否在同一局域网
- 检查防火墙是否阻止 WebSocket 端口

## 项目结构说明

```
r8/
├── .gitignore                    # Git 忽略文件
├── chat-server/                  # 后端项目
│   ├── pom.xml                   # Maven 配置
│   └── src/
│       └── main/
│           ├── java/com/chat/
│           │   ├── ChatApplication.java          # 启动类
│           │   ├── common/                       # 通用组件
│           │   │   ├── Result.java               # 统一响应
│           │   │   ├── BusinessException.java    # 业务异常
│           │   │   └── GlobalExceptionHandler.java  # 全局异常处理
│           │   ├── config/                       # 配置类
│           │   │   ├── RedisConfig.java
│           │   │   ├── CorsConfig.java
│           │   │   ├── MyBatisPlusConfig.java
│           │   │   ├── WebSocketConfig.java
│           │   │   └── WebMvcConfig.java
│           │   ├── controller/                   # 控制器
│           │   │   ├── AuthController.java
│           │   │   ├── UserController.java
│           │   │   ├── FriendController.java
│           │   │   ├── GroupController.java
│           │   │   └── MessageController.java
│           │   ├── dto/                          # 数据传输对象
│           │   ├── entity/                       # 实体类
│           │   ├── interceptor/                  # 拦截器
│           │   │   └── JwtInterceptor.java
│           │   ├── mapper/                       # MyBatis Mapper
│           │   ├── service/                      # 服务层
│           │   │   └── impl/
│           │   ├── utils/                        # 工具类
│           │   │   └── JwtUtil.java
│           │   ├── vo/                           # 视图对象
│           │   └── websocket/                    # WebSocket 相关
│           │       ├── WebSocketMessage.java
│           │       ├── WebSocketSessionManager.java
│           │       └── WebSocketHandler.java
│           └── resources/
│               ├── application.yml               # 应用配置
│               ├── db/
│               │   └── init.sql                  # 数据库初始化脚本
│               └── docs/
│                   ├── API.md                    # API 文档
│                   ├── WebSocket.md              # WebSocket 协议文档
│                   └── DEPLOY.md                 # 部署指南
│
└── chat-client/                  # 前端项目
    ├── package.json              # 依赖配置
    ├── vite.config.ts            # Vite 配置
    ├── tsconfig.json             # TypeScript 配置
    ├── index.html                # 入口 HTML
    └── src/
        ├── main.ts               # 入口文件
        ├── App.vue               # 根组件
        ├── router/               # 路由配置
        │   └── index.ts
        ├── stores/               # Pinia 状态管理
        │   ├── user.ts
        │   └── chat.ts
        ├── views/                # 页面组件
        │   ├── Login.vue
        │   ├── Register.vue
        │   └── ChatRoom.vue      # 主聊天页面
        ├── api/                  # API 封装
        │   ├── request.ts
        │   ├── auth.ts
        │   ├── user.ts
        │   ├── friend.ts
        │   ├── group.ts
        │   └── message.ts
        ├── services/             # 服务
        │   └── websocket.ts
        ├── utils/                # 工具函数
        │   ├── storage.ts
        │   └── date.ts
        ├── types/                # 类型定义
        │   └── index.ts
        └── styles/               # 样式
            └── main.scss
```

## 技术栈总结

### 后端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 17 | 编程语言 |
| Spring Boot | 3.2.x | 应用框架 |
| Spring WebSocket | 3.2.x | 实时通信 |
| MyBatis-Plus | 3.5.5 | ORM 框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 6.0+ | 缓存/在线状态 |
| JWT | 0.12.x | 认证授权 |
| Lombok | - | 简化代码 |
| Hutool | 5.8.x | 工具库 |

### 前端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4.x | 前端框架 |
| TypeScript | 5.3.x | 类型系统 |
| Vite | 5.0.x | 构建工具 |
| Pinia | 2.1.x | 状态管理 |
| Vue Router | 4.2.x | 路由管理 |
| Element Plus | 2.4.x | UI 组件库 |
| Axios | 1.6.x | HTTP 客户端 |
| Day.js | 1.11.x | 日期处理 |
| Sass | 1.69.x | CSS 预处理器 |

## 许可证

MIT License
