# 实时协同白板与文档批注系统

## 项目简介

一个基于 Java Spring Boot 3 + Vue 3 + WebSocket + Redis 开发的实时协同白板系统，支持多个用户同时进入同一个房间，实时绘制线条、添加文字便签、移动图形、删除元素、同步在线用户列表，并将操作记录保存到后端。

## 技术栈

### 后端
- **Java 17**
- **Spring Boot 3.2.5**
- **Spring WebSocket (STOMP)**
- **Spring Data Redis**
- **Spring Data JPA**
- **MySQL 8.0+**
- **Redis 6.0+**
- **Lombok**

### 前端
- **Vue 3 (Composition API)**
- **Vite 5**
- **Vue Router 4**
- **SockJS + STOMP.js**
- **Canvas API**

## 功能特性

- ✅ 多用户实时协同白板
- ✅ 支持画笔、直线、矩形、圆形绘制
- ✅ 文字便签和文本批注
- ✅ 元素选择、移动、删除
- ✅ 实时在线用户列表同步
- ✅ 操作记录持久化存储
- ✅ 基于房间隔离
- ✅ 自定义颜色和画笔粗细
- ✅ 操作实时同步（WebSocket）

## 项目结构

```
r23/
├── backend/                 # Spring Boot 后端
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/collaborative/whiteboard/
│           │   ├── WhiteboardApplication.java
│           │   ├── config/
│           │   │   ├── WebSocketConfig.java
│           │   │   ├── RedisConfig.java
│           │   └── CorsConfig.java
│           │   ├── controller/
│           │   │   ├── RoomController.java
│           │   └── WhiteboardWebSocketController.java
│           │   ├── dto/
│           │   │   ├── WhiteboardMessage.java
│           │   └── UserInfo.java
│           │   ├── entity/
│           │   │   ├── Room.java
│           │   │   ├── WhiteboardElement.java
│           │   └── OperationLog.java
│           │   ├── repository/
│           │   │   ├── RoomRepository.java
│           │   │   ├── WhiteboardElementRepository.java
│           │   └── OperationLogRepository.java
│           │   └── service/
│           │       ├── RoomService.java
│           │       └── UserService.java
│           └── resources/
│               └── application.yml
├── frontend/                # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── style.css
│       ├── router/
│       │   └── index.js
│       ├── services/
│       │   ├── api.js
│       │   └── websocket.js
│       ├── components/
│       │   └── Whiteboard.vue
│       └── views/
│           ├── Home.vue
│           └── Room.vue
├── database/
│   └── schema.sql
└── .gitignore
└── README.md
```

## WebSocket 消息协议

### 消息格式

```json
{
  "type": "ADD|UPDATE|DELETE|DRAW|JOIN|LEAVE|USER_LIST|CURSOR",
  "roomId": "房间ID",
  "userId": "用户ID",
  "elementId": "元素ID(可选)",
  "payload": {...},
  "timestamp": 1234567890
}
```

### 消息类型说明

| 类型 | 说明 | Payload |
|------|------|---------|
| ADD | 添加元素 | 元素数据对象 |
| UPDATE | 更新元素(移动等) | 元素数据对象 |
| DELETE | 删除元素 | 空 |
| DRAW | 实时绘制(画笔) | 元素数据对象 |
| JOIN | 用户加入 | {username: "昵称"} |
| LEAVE | 用户离开 | 空 |
| USER_LIST | 在线用户列表 | UserInfo数组 |
| CURSOR | 鼠标位置 | {x, y} |

### 元素类型数据结构

#### 画笔 (pen)
```json
{
  "type": "pen",
  "points": [{"x": 10, "y": 20}, ...],
  "color": "#333333",
  "lineWidth": 3
}
```

#### 直线 (line)
```json
{
  "type": "line",
  "startX": 10,
  "startY": 10,
  "endX": 100,
  "endY": 100,
  "color": "#333333",
  "lineWidth": 3
}
```

#### 矩形 (rect)
```json
{
  "type": "rect",
  "startX": 10,
  "startY": 10,
  "endX": 100,
  "endY": 80,
  "color": "#333333",
  "lineWidth": 3
}
```

#### 圆形 (circle)
```json
{
  "type": "circle",
  "startX": 50,
  "startY": 50,
  "endX": 150,
  "endY": 150,
  "color": "#333333",
  "lineWidth": 3
}
```

#### 便签 (sticky)
```json
{
  "type": "sticky",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 120,
  "text": "这是一条便签",
  "bgColor": "#FFF9C4",
  "color": "#333333"
}
```

#### 文字 (text)
```json
{
  "type": "text",
  "x": 100,
  "y": 100,
  "text": "文本内容",
  "color": "#333333",
  "fontSize": 16
}
```

## 数据库表结构

### rooms (房间表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| name | VARCHAR(100) | 房间名称 |
| description | VARCHAR(500) | 房间描述 |
| created_by | VARCHAR(50) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### whiteboard_elements (白板元素表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键 |
| room_id | VARCHAR(50) | 房间ID |
| type | VARCHAR(20) | 元素类型 |
| data | TEXT | 元素数据(JSON) |
| created_by | VARCHAR(50) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### operation_logs (操作日志表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键自增 |
| room_id | VARCHAR(50) | 房间ID |
| user_id | VARCHAR(50) | 用户ID |
| operation_type | VARCHAR(20) | 操作类型 |
| element_id | VARCHAR(50) | 元素ID |
| operation_data | TEXT | 操作数据 |
| created_at | DATETIME | 操作时间 |

## Redis 数据结构

### 用户在线状态
```
Key: whiteboard:room:{roomId}:users
Type: Hash
Field: userId
Value: UserInfo(JSON字符串
```

## 运行说明

### 前置要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.8+

### 安装步骤

#### 1. 启动 MySQL

```bash
# Windows (如果已安装 MySQL 服务)
net start mysql80
```

#### 2. 启动 Redis

```bash
# Windows
redis-server
```

#### 3. 初始化数据库

```bash
# 执行 SQL 脚本
mysql -u root -p < database/schema.sql
```

#### 4. 配置数据库连接

编辑 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/whiteboard_db
    username: your_username
    password: your_password
```

#### 5. 运行后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

#### 6. 运行前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动

### 使用说明

1. 打开浏览器访问 `http://localhost:3000`
2. 输入房间名称创建新房间，或输入房间ID加入已有房间
3. 进入房间后，使用左侧工具栏进行绘制
4. 分享房间ID给其他人，他们可以实时看到你的操作
5. 右侧面板显示当前在线用户

### API 接口

#### 房间管理
- `POST /api/rooms` - 创建房间
- `GET /api/rooms` - 获取所有房间
- `GET /api/rooms/{roomId}` - 获取房间详情
- `GET /api/rooms/{roomId}/init` - 获取房间初始化数据
- `GET /api/rooms/{roomId}/elements` - 获取房间所有元素
- `GET /api/rooms/{roomId}/users` - 获取在线用户

#### WebSocket 端点
- `GET /ws` - WebSocket 连接端点 (SockJS)

### WebSocket 订阅

- `/topic/room/{roomId}` - 订阅房间消息

### WebSocket 发送

- `/app/whiteboard/draw` - 绘制消息
- `/app/whiteboard/add` - 添加元素
- `/app/whiteboard/update` - 更新元素
- `/app/whiteboard/delete` - 删除元素
- `/app/whiteboard/join` - 加入房间
- `/app/whiteboard/leave` - 离开房间
- `/app/whiteboard/cursor` - 鼠标位置

## 常见问题

### 1. WebSocket 连接失败

- 确认后端服务已启动
- 检查防火墙设置
- 查看浏览器控制台错误信息

### 2. Redis 连接失败

- 确认 Redis 服务已启动
- 检查 application.yml 中的 Redis 配置

### 3. 数据库连接失败

- 确认 MySQL 服务已启动
- 检查数据库用户名密码
- 确认数据库已创建

## License

MIT License
