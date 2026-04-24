# WebSocket 消息协议文档

## 连接方式

WebSocket 连接地址：
```
ws://{host}:{port}/ws/chat?token={jwtToken}
```

### 示例
```
ws://localhost:8080/ws/chat?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 注意：连接时必须携带有效的 JWT Token 进行鉴权，否则连接会被拒绝。

## 消息格式

所有 WebSocket 消息都使用统一的 JSON 格式：

```json
{
  "type": "chat",
  "fromUserId": 1,
  "toUserId": 2,
  "groupId": 0,
  "chatType": 1,
  "messageType": 1,
  "content": "消息内容",
  "data": null,
  "timestamp": "2024-01-01T12:00:00"
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 消息类型 |
| fromUserId | number | 发送者用户ID |
| toUserId | number | 接收者用户ID (私聊) |
| groupId | number | 群组ID (群聊) |
| chatType | number | 聊天类型：1-私聊，2-群聊 |
| messageType | number | 消息类型：1-文本，2-图片，3-文件，4-系统 |
| content | string | 消息内容 |
| data | any | 额外数据 |
| timestamp | string | 时间戳 (ISO 8601 格式) |

## 消息类型

### 1. 聊天消息 (chat)
**方向**: 客户端 <-> 服务端

**客户端发送 (私聊)**:
```json
{
  "type": "chat",
  "fromUserId": 1,
  "toUserId": 2,
  "groupId": 0,
  "chatType": 1,
  "messageType": 1,
  "content": "你好！",
  "data": null,
  "timestamp": "2024-01-01T12:00:00"
}
```

**客户端发送 (群聊)**:
```json
{
  "type": "chat",
  "fromUserId": 1,
  "toUserId": 0,
  "groupId": 1,
  "chatType": 2,
  "messageType": 1,
  "content": "大家好！",
  "data": null,
  "timestamp": "2024-01-01T12:00:00"
}
```

**服务端推送**:
服务端会将聊天消息推送给接收方。对于私聊，推送给 `toUserId`；对于群聊，推送给所有群成员。

### 2. 上线通知 (online)
**方向**: 服务端 -> 客户端

当有用户上线时，服务端会向其所有好友推送上线通知：

```json
{
  "type": "online",
  "fromUserId": 1,
  "toUserId": 0,
  "groupId": 0,
  "chatType": 0,
  "messageType": 0,
  "content": "",
  "data": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

**说明**:
- `fromUserId`: 上线的用户ID
- `data`: `true` 表示上线

### 3. 下线通知 (offline)
**方向**: 服务端 -> 客户端

当有用户下线时，服务端会向其所有好友推送下线通知：

```json
{
  "type": "offline",
  "fromUserId": 1,
  "toUserId": 0,
  "groupId": 0,
  "chatType": 0,
  "messageType": 0,
  "content": "",
  "data": false,
  "timestamp": "2024-01-01T12:00:00"
}
```

**说明**:
- `fromUserId`: 下线的用户ID
- `data`: `false` 表示下线

### 4. 已读通知 (read)
**方向**: 客户端 <-> 服务端

**客户端发送**:
当用户打开聊天窗口时，客户端发送已读通知：

```json
{
  "type": "read",
  "fromUserId": 1,
  "toUserId": 2,
  "groupId": 0,
  "chatType": 1,
  "messageType": 0,
  "content": "",
  "data": null,
  "timestamp": "2024-01-01T12:00:00"
}
```

**服务端推送**:
服务端将已读通知推送给消息发送方。

### 5. 正在输入通知 (typing)
**方向**: 客户端 <-> 服务端

**客户端发送**:
当用户正在输入时，发送正在输入通知：

```json
{
  "type": "typing",
  "fromUserId": 1,
  "toUserId": 2,
  "groupId": 0,
  "chatType": 1,
  "messageType": 0,
  "content": "",
  "data": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

**说明**:
- `data`: `true` 表示正在输入，`false` 表示停止输入

### 6. 心跳检测 (heartbeat)
**方向**: 客户端 <-> 服务端

客户端每隔 30 秒发送心跳包，服务端响应相同的消息：

**请求**:
```json
{
  "type": "heartbeat",
  "fromUserId": 0,
  "toUserId": 0,
  "groupId": 0,
  "chatType": 0,
  "messageType": 0,
  "content": "",
  "data": null,
  "timestamp": "2024-01-01T12:00:00"
}
```

**响应**: 相同的消息格式

## 连接状态管理

### 连接建立流程
1. 客户端携带 JWT Token 建立 WebSocket 连接
2. 服务端验证 Token 有效性
3. 验证通过后，将用户标记为在线
4. 服务端向用户的所有好友推送上线通知

### 连接断开流程
1. 客户端主动断开或连接超时
2. 服务端将用户标记为离线
3. 服务端向用户的所有好友推送下线通知

### 重连机制
1. 连接断开后，客户端自动尝试重连（最多 5 次）
2. 每次重连间隔 3 秒
3. 重连成功后，重新同步在线状态
4. 重连失败后，提示用户刷新页面

## 消息可靠性

### 离线消息
- 当接收方不在线时，消息会保存到离线消息表
- 用户上线后，可以通过 `/api/message/offline` 接口获取离线消息

### 消息状态流转
```
已发送 (SENT: 0)
    ↓
已送达 (DELIVERED: 1)  - 消息到达服务端
    ↓
已读 (READ: 2)         - 用户打开聊天窗口
```

## 前端示例代码

```typescript
// 创建 WebSocket 连接
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:8080/ws/chat?token=${token}`);

// 连接打开
ws.onopen = () => {
  console.log('WebSocket 连接成功');
  // 开始心跳
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      fromUserId: 0,
      toUserId: 0,
      groupId: 0,
      chatType: 0,
      messageType: 0,
      content: '',
      data: null,
      timestamp: new Date().toISOString()
    }));
  }, 30000);
};

// 接收消息
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case 'chat':
      // 处理聊天消息
      console.log('收到消息:', msg);
      break;
    case 'online':
      // 用户上线
      console.log('用户上线:', msg.fromUserId);
      break;
    case 'offline':
      // 用户下线
      console.log('用户下线:', msg.fromUserId);
      break;
    case 'read':
      // 消息已读
      console.log('消息已读:', msg);
      break;
    case 'heartbeat':
      // 心跳响应
      break;
  }
};

// 发送消息
function sendPrivateMessage(toUserId: number, content: string) {
  const msg = {
    type: 'chat',
    fromUserId: currentUserId,
    toUserId: toUserId,
    groupId: 0,
    chatType: 1,
    messageType: 1,
    content: content,
    data: null,
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(msg));
}
```
