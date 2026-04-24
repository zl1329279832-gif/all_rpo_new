# Java 窗口聊天系统

一个基于 Java Socket 和 Swing 的桌面聊天系统，支持群聊、私聊、在线用户列表等功能。

## 功能特性

- 服务端
  - 多客户端连接管理
  - 消息转发
  - 在线用户列表维护
  - 群聊广播
  - 私聊转发
  - 心跳检测
  - 上线/下线通知

- 客户端
  - Swing 图形界面
  - 登录窗口
  - 聊天主窗口
  - 群聊功能
  - 私聊功能
  - 在线用户列表
  - 系统提示
  - 心跳检测
  - 异常断线处理

## 技术栈

- Java 17
- Socket 网络编程
- Swing/AWT 图形界面
- Maven 项目管理
- 序列化通信

## 项目结构

```
java-chat-system/
├── common/              # 公共模块
│   ├── src/main/java/com/chat/common/
│   │   ├── constants/    # 常量类
│   │   ├── protocol/ # 消息协议
│   │   └── util/     # 工具类
│   └── pom.xml
├── server/            # 服务端模块
│   ├── src/main/java/com/chat/server/
│   │   ├── handler/  # 消息处理器
│   │   ├── manager/ # 客户端管理器
│   │   ├── model/    # 数据模型
│   │   └── ServerMain.java
│   └── pom.xml
├── client/            # 客户端模块
│   ├── src/main/java/com/chat/client/
│   │   ├── network/ # 网络通信
│   │   └── ui/       # 图形界面
│   └── pom.xml
├── pom.xml            # 父POM
└── README.md
```

## 运行步骤

### 1. 编译项目

在项目根目录下执行：

```bash
mvn clean install
```

### 2. 启动服务端

```bash
cd server
mvn exec:java -Dexec.mainClass="com.chat.server.ServerMain"
```

或者在 IDE 中直接运行 `ServerMain.java`

### 3. 启动客户端

```bash
cd client
mvn exec:java -Dexec.mainClass="com.chat.client.ClientMain"
```

或者在 IDE 中直接运行 `ClientMain.java`

可以启动多个客户端实例进行测试。

## 测试方式

1. 首先启动服务端
2. 启动第一个客户端，输入昵称（如：张三）
3. 启动第二个客户端，输入昵称（如：李四）
4. 在群聊标签页发送消息，两个客户端都能收到
5. 在右侧在线用户列表选择用户，切换到私聊标签页发送私聊消息
6. 关闭一个客户端，另一个客户端能收到下线通知

## 消息协议

| 消息类型 | 说明 |
|---------|------|
| LOGIN | 登录请求 |
| LOGIN_RESPONSE | 登录响应 |
| LOGOUT | 登出请求 |
| LOGOUT_RESPONSE | 登出响应 |
| CHAT_GROUP | 群聊消息 |
| CHAT_PRIVATE | 私聊消息 |
| USER_LIST | 在线用户列表 |
| HEARTBEAT | 心跳请求 |
| HEARTBEAT_RESPONSE | 心跳响应 |
| SYSTEM_NOTICE | 系统通知 |

## 注意事项

- 确保 Java 17 或更高版本已安装
- 确保端口 8888 未被占用
- 服务端必须在客户端之前启动
