# 实时协同白板与文档批注系统

一个基于 **Java Spring Boot 3 + Vue 3 + WebSocket + Redis** 开发的实时多人协同白板系统。

## 功能特性

- ✅ 多用户实时协同编辑
- ✅ 实时绘制线条（画笔/橡皮擦）
- ✅ 添加文字便签并可编辑
- ✅ 移动图形元素
- ✅ 删除元素
- ✅ 清空画布
- ✅ 实时同步在线用户列表
- ✅ 操作记录保存到数据库
- ✅ 房间状态 Redis 缓存
- ✅ WebSocket 实时消息推送
- ✅ 断线自动重连

## 技术栈

### 后端
- **Java 17**
- **Spring Boot 3.2**
- **Spring WebSocket** - 实时通信
- **Spring Data Redis** - 房间状态缓存
- **Spring Data JPA** - 数据持久化
- **MySQL** - 关系型数据库
- **Lombok** - 代码简化

### 前端
- **Vue 3** (Composition API)
- **Vite** - 构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Canvas API** - 白板绘制
- **WebSocket** - 实时通信

### 基础设施
- **Redis** - 内存数据库，用于房间状态和实时数据缓存
- **MySQL** - 持久化存储

## 项目结构

```
r23/
├── backend/                          # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/collab/whiteboard/
│       │   ├── WhiteboardApplication.java    # 主应用类
│       │   ├── config/                       # 配置类
│       │   │   ├── CorsConfig.java
│       │   │   ├── RedisConfig.java
│       │   │   └── WebSocketConfig.java
│       │   ├── controller/                   # 控制器
│       │   │   └── RoomController.java
│       │   ├── entity/                       # 实体类
│       │   │   ├── OperationLog.java
│       │   │   ├── Room.java
│       │   │   └── WhiteboardElement.java
│       │   ├── message/                      # 消息协议
│       │   │   ├── DeleteElementPayload.java
│       │   │   ├── DrawLinePayload.java
│       │   │   ├── MessageType.java
│       │   │   ├── MoveElementPayload.java
│       │   │   ├── StickerPayload.java
│       │   │   ├── UserInfo.java
│       │   │   └── WebSocketMessage.java
│       │   ├── repository/                   # 数据访问层
│       │   │   ├── OperationLogRepository.java
│       │   │   ├── RoomRepository.java
│       │   │   └── WhiteboardElementRepository.java
│       │   ├── service/                      # 业务逻辑层
│       │   │   ├── OperationLogService.java
│       │   │   ├── RoomService.java
│       │   │   └── WhiteboardService.java
│       │   └── websocket/                    # WebSocket 处理器
│       │       └── WhiteboardWebSocketHandler.java
│       └── resources/
│           ├── application.yml
│           └── schema.sql                    # 数据库初始化脚本
├── frontend/                         # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── style.css
│       ├── router/index.js
│       ├── stores/
│       │   └── whiteboard.js         # Pinia 状态管理
│       ├── utils/
│       │   ├── messageTypes.js       # 消息类型定义
│       │   └── websocket.js          # WebSocket 客户端
│       ├── views/
│       │   ├── HomeView.vue          # 首页（创建/加入房间）
│       │   └── WhiteboardView.vue    # 白板页面
│       └── components/
│           ├── Toolbar.vue           # 工具栏
│           ├── WhiteboardCanvas.vue  # Canvas 画板
│           ├── StickerLayer.vue      # 便签层
│           ├── SelectionLayer.vue    # 选择层
│           └── UserList.vue          # 用户列表
├── .gitignore
└── README.md
```

## 消息协议设计

### 消息格式
```json
{
  "type": "DRAW_LINE",
  "roomId": "abc123",
  "userId": "user_001",
  "userName": "张三",
  "payload": {...},
  "timestamp": 1700000000000
}
```

### 消息类型

| 类型 | 说明 | Payload |
|------|------|---------|
| `JOIN_ROOM` | 加入房间 | UserInfo |
| `LEAVE_ROOM` | 离开房间 | null |
| `USER_LIST` | 用户列表更新 | UserInfo[] |
| `DRAW_LINE` | 绘制线条 | DrawLinePayload |
| `ADD_STICKER` | 添加便签 | StickerPayload |
| `MOVE_ELEMENT` | 移动元素 | MoveElementPayload |
| `DELETE_ELEMENT` | 删除元素 | DeleteElementPayload |
| `CLEAR_CANVAS` | 清空画布 | {} |
| `SYNC_STATE` | 同步状态 | Element[] |

### Payload 结构

**DrawLinePayload（线条）:**
```json
{
  "elementId": "uuid",
  "points": [{"x": 10, "y": 20}, {"x": 20, "y": 30}],
  "color": "#FF0000",
  "lineWidth": 3,
  "lineCap": "round",
  "lineJoin": "round"
}
```

**StickerPayload（便签）:**
```json
{
  "elementId": "uuid",
  "text": "这是一个便签",
  "x": 100,
  "y": 100,
  "width": 150,
  "height": 100,
  "backgroundColor": "#FFEAA7",
  "textColor": "#000000",
  "fontSize": 14
}
```

**MoveElementPayload（移动）:**
```json
{
  "elementId": "uuid",
  "deltaX": 10,
  "deltaY": 10,
  "newX": 110,
  "newY": 110
}
```

## 数据库表结构

### rooms（房间表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键，房间ID |
| name | VARCHAR(100) | 房间名称 |
| description | VARCHAR(500) | 房间描述 |
| created_by | VARCHAR(50) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| is_active | BOOLEAN | 是否激活 |

### whiteboard_elements（白板元素表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(50) | 主键，元素ID |
| room_id | VARCHAR(50) | 所属房间ID |
| type | ENUM | 元素类型（LINE/STICKER/SHAPE） |
| data | TEXT | 元素数据（JSON格式） |
| created_by | VARCHAR(50) | 创建者 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| is_deleted | BOOLEAN | 是否删除 |

### operation_logs（操作日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| room_id | VARCHAR(50) | 房间ID |
| user_id | VARCHAR(50) | 用户ID |
| user_name | VARCHAR(100) | 用户名 |
| operation_type | ENUM | 操作类型 |
| element_id | VARCHAR(50) | 关联元素ID |
| payload | TEXT | 操作详情（JSON） |
| created_at | DATETIME | 操作时间 |

## 环境要求

- **Java JDK 17+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Redis 6.0+**
- **Maven 3.8+**

## 安装与运行

### 1. 启动 MySQL 数据库

确保 MySQL 服务已启动，然后执行初始化脚本：

```bash
# 方法1：使用 MySQL 命令行
mysql -u root -p < backend/src/main/resources/schema.sql

# 方法2：在 MySQL 客户端中手动执行 schema.sql 中的 SQL 语句
```

或者，Spring Boot 启动时会自动根据实体类创建表结构（`ddl-auto: update`）。

### 2. 启动 Redis

确保 Redis 服务已启动：

```bash
# Windows (如果已安装)
redis-server

# 或使用 Docker
docker run -p 6379:6379 redis
```

### 3. 配置数据库连接

修改 `backend/src/main/resources/application.yml` 中的数据库配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/collab_whiteboard?useSSL=false&serverTimezone=UTC
    username: your_username
    password: your_password
```

### 4. 运行后端

```bash
cd backend

# 使用 Maven 运行
mvn spring-boot:run

# 或先打包再运行
mvn clean package
java -jar target/whiteboard-1.0.0.jar
```

后端服务将在 `http://localhost:8080` 启动。

### 5. 运行前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端开发服务器将在 `http://localhost:3000` 启动。

### 6. 访问应用

打开浏览器访问：`http://localhost:3000`

## 使用说明

1. **创建房间**：在首页输入房间名称，点击"创建房间"
2. **加入房间**：输入房间ID，点击"加入房间"，或从可用房间列表选择
3. **使用工具栏**：
   - 🖱️ **选择工具**：选中元素进行移动或删除
   - ✏️ **画笔**：在画布上绘制线条
   - 🧹 **橡皮擦**：擦除线条
   - 📝 **便签**：点击画布添加便签，双击编辑内容
   - 🎨 **颜色**：选择绘制颜色
   - 📏 **粗细**：调节线条粗细
   - 🗑️ **删除**：删除选中的元素
   - 🧹 **清空**：清空整个画布

4. **实时协作**：
   - 分享房间ID给其他用户
   - 多个用户可以同时在同一房间编辑
   - 用户列表显示所有在线用户
   - 所有操作实时同步

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `V` | 选择工具 |
| `P` | 画笔工具 |
| `E` | 橡皮擦工具 |
| `S` | 便签工具 |
| `Delete/Backspace` | 删除选中元素 |
| `Esc` | 取消选择 |

## API 接口

### 房间管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rooms` | 获取所有激活房间 |
| GET | `/api/rooms/{id}` | 获取房间详情 |
| POST | `/api/rooms` | 创建房间 |
| PUT | `/api/rooms/{id}` | 更新房间 |
| DELETE | `/api/rooms/{id}` | 停用房间 |

### WebSocket 连接

- **连接地址**：`ws://localhost:8080/ws/whiteboard/{roomId}`

## Redis 数据结构

- `whiteboard:room:{roomId}:users` (Hash) - 房间用户列表
- `whiteboard:room:{roomId}:elements` (Set) - 房间元素ID集合
- `whiteboard:room:{roomId}:element:{elementId}` (String/JSON) - 元素详情

数据过期时间：24小时

## 注意事项

1. 确保 MySQL 和 Redis 服务正常运行
2. 首次运行时会自动创建数据库表（需要有 CREATE 权限）
3. 前后端必须同时启动才能正常使用
4. 多用户测试需要在不同浏览器或无痕模式下打开

## 开发建议

- **生产环境**：配置 CORS 限制，使用 HTTPS/WSS
- **数据库**：考虑使用连接池，配置慢查询日志
- **Redis**：生产环境建议使用 Redis Cluster 或 Sentinel
- **日志**：配置 ELK 或其他日志聚合方案
- **监控**：添加健康检查和性能监控

## 许可证

MIT License
