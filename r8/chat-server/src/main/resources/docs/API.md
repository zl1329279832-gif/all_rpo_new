# 聊天室系统 API 文档

## 统一响应格式

所有接口返回统一的 JSON 格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... },
  "timestamp": 1700000000000
}
```

- `code`: 状态码，200 表示成功，其他表示失败
- `message`: 响应消息
- `data`: 响应数据
- `timestamp`: 时间戳

## 认证接口

### 登录
- **URL**: `POST /api/auth/login`
- **认证**: 不需要
- **请求体**:
```json
{
  "username": "admin",
  "password": "123456"
}
```
- **响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "",
      "email": "",
      "phone": "",
      "status": 1,
      "online": true,
      "lastLoginTime": "2024-01-01T12:00:00",
      "createTime": "2024-01-01T00:00:00"
    }
  }
}
```

### 注册
- **URL**: `POST /api/auth/register`
- **认证**: 不需要
- **请求体**:
```json
{
  "username": "newuser",
  "password": "123456",
  "confirmPassword": "123456",
  "nickname": "新用户"
}
```

### 登出
- **URL**: `POST /api/auth/logout`
- **认证**: 需要 (Bearer Token)

## 用户接口

### 获取当前用户信息
- **URL**: `GET /api/user/info`
- **认证**: 需要

### 根据 ID 获取用户信息
- **URL**: `GET /api/user/info/id?id={userId}`
- **认证**: 需要

### 搜索用户
- **URL**: `GET /api/user/search?keyword={keyword}`
- **认证**: 需要

### 获取在线用户列表
- **URL**: `GET /api/user/online`
- **认证**: 需要

## 好友接口

### 获取好友列表
- **URL**: `GET /api/friend/list`
- **认证**: 需要

### 获取待处理好友申请
- **URL**: `GET /api/friend/pending`
- **认证**: 需要

### 发送好友申请
- **URL**: `POST /api/friend/add`
- **认证**: 需要
- **请求体**:
```json
{
  "friendId": 2,
  "remark": "备注名"
}
```

### 接受好友申请
- **URL**: `POST /api/friend/accept?friendId={friendId}`
- **认证**: 需要

### 拒绝好友申请
- **URL**: `POST /api/friend/reject?friendId={friendId}`
- **认证**: 需要

### 删除好友
- **URL**: `DELETE /api/friend/remove?friendId={friendId}`
- **认证**: 需要

## 群组接口

### 获取我的群组列表
- **URL**: `GET /api/group/my`
- **认证**: 需要

### 获取群组信息
- **URL**: `GET /api/group/info/{groupId}`
- **认证**: 需要

### 获取群成员列表
- **URL**: `GET /api/group/members/{groupId}`
- **认证**: 需要

### 创建群组
- **URL**: `POST /api/group/create`
- **认证**: 需要
- **请求体**:
```json
{
  "groupName": "技术交流群",
  "groupNotice": "欢迎加入",
  "memberIds": [2, 3, 4]
}
```

### 解散群组
- **URL**: `DELETE /api/group/dissolve/{groupId}`
- **认证**: 需要 (群主权限)

### 退出群组
- **URL**: `POST /api/group/quit/{groupId}`
- **认证**: 需要

### 添加群成员
- **URL**: `POST /api/group/add-members?groupId={groupId}&userIds=2,3,4`
- **认证**: 需要

### 移除群成员
- **URL**: `POST /api/group/remove-member?groupId={groupId}&memberId={memberId}`
- **认证**: 需要 (群主权限)

## 消息接口

### 发送消息
- **URL**: `POST /api/message/send`
- **认证**: 需要
- **请求体** (私聊):
```json
{
  "chatType": 1,
  "toUserId": 2,
  "messageType": 1,
  "content": "你好！"
}
```
- **请求体** (群聊):
```json
{
  "chatType": 2,
  "groupId": 1,
  "messageType": 1,
  "content": "大家好！"
}
```

### 获取历史消息
- **URL**: `GET /api/message/history?targetId={targetId}&chatType={chatType}&pageNum={pageNum}&pageSize={pageSize}`
- **认证**: 需要
- **参数**:
  - `targetId`: 私聊为用户ID，群聊为群组ID
  - `chatType`: 1-私聊，2-群聊
  - `pageNum`: 页码，默认1
  - `pageSize`: 每页数量，默认50

### 获取所有未读消息数
- **URL**: `GET /api/message/unread/counts`
- **认证**: 需要

### 获取指定会话未读消息数
- **URL**: `GET /api/message/unread/count?targetId={targetId}&chatType={chatType}`
- **认证**: 需要

### 标记消息为已读
- **URL**: `POST /api/message/read?targetId={targetId}&chatType={chatType}`
- **认证**: 需要

### 获取离线消息
- **URL**: `GET /api/message/offline`
- **认证**: 需要

### 清除离线消息
- **URL**: `POST /api/message/offline/clear`
- **认证**: 需要

## 常量定义

### 聊天类型 (chatType)
- `1`: 私聊 (PRIVATE)
- `2`: 群聊 (GROUP)

### 消息类型 (messageType)
- `1`: 文本消息 (TEXT)
- `2`: 图片消息 (IMAGE)
- `3`: 文件消息 (FILE)
- `4`: 系统消息 (SYSTEM)

### 消息状态 (status)
- `0`: 已发送 (SENT)
- `1`: 已送达 (DELIVERED)
- `2`: 已读 (READ)

### 好友状态 (status)
- `0`: 待确认 (PENDING)
- `1`: 已通过 (ACCEPTED)
