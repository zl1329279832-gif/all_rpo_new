import { User, Message, ChatSession, Contact } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export const currentUser: User = {
  id: 'current_user_001',
  username: 'demo_user',
  nickname: '我',
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bpng.png',
  status: 'online',
  signature: '这是一个测试签名'
}

export const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'zhangsan',
    nickname: '张三',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    status: 'online',
    signature: '今天天气真好',
    lastOnlineTime: new Date().toISOString()
  },
  {
    id: 'user_002',
    username: 'lisi',
    nickname: '李四',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    status: 'away',
    signature: '努力工作中',
    lastOnlineTime: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'user_003',
    username: 'wangwu',
    nickname: '王五',
    avatar: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
    status: 'offline',
    signature: '生活不止眼前的苟且',
    lastOnlineTime: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'user_004',
    username: 'zhaoliu',
    nickname: '赵六',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    status: 'online',
    signature: '热爱编程',
    lastOnlineTime: new Date().toISOString()
  },
  {
    id: 'user_005',
    username: 'sunqi',
    nickname: '孙七',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    status: 'online',
    signature: '前端开发工程师',
    lastOnlineTime: new Date().toISOString()
  }
]

export const mockContacts: Contact[] = mockUsers.map(user => ({
  ...user,
  isFriend: true,
  lastChatTime: new Date(Date.now() - Math.random() * 86400000 * 7).getTime()
}))

const generateMessages = (senderIds: string[], receiverId: string, count: number): Message[] => {
  const messages: Message[] = []
  const now = Date.now()
  
  for (let i = 0; i < count; i++) {
    const senderId = senderIds[Math.floor(Math.random() * senderIds.length)]
    const isSelf = senderId === currentUser.id
    
    messages.push({
      id: uuidv4(),
      senderId,
      receiverId,
      content: `这是第 ${count - i} 条测试消息，消息内容可以很长很长很长很长很长很长很长很长很长很长。`,
      type: 'text',
      status: isSelf ? 'read' : 'read',
      timestamp: now - (count - i) * 60000 - Math.random() * 30000,
      isRead: true,
      isRecalled: false
    })
  }
  
  return messages
}

export const mockSessions: ChatSession[] = [
  {
    id: 'session_single_001',
    type: 'single',
    name: '张三',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    unreadCount: 3,
    createTime: Date.now() - 86400000 * 30,
    lastMessage: {
      id: uuidv4(),
      senderId: 'user_001',
      receiverId: 'current_user_001',
      content: '你好，最近怎么样？',
      type: 'text',
      status: 'read',
      timestamp: Date.now() - 300000,
      isRead: false,
      isRecalled: false
    }
  },
  {
    id: 'session_single_002',
    type: 'single',
    name: '李四',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    unreadCount: 0,
    createTime: Date.now() - 86400000 * 20,
    lastMessage: {
      id: uuidv4(),
      senderId: 'current_user_001',
      receiverId: 'user_002',
      content: '好的，明天见',
      type: 'text',
      status: 'read',
      timestamp: Date.now() - 3600000,
      isRead: true,
      isRecalled: false
    }
  },
  {
    id: 'session_group_001',
    type: 'group',
    name: '前端开发交流群',
    avatar: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
    unreadCount: 15,
    ownerId: 'user_001',
    createTime: Date.now() - 86400000 * 60,
    members: [...mockUsers.slice(0, 4), currentUser],
    lastMessage: {
      id: uuidv4(),
      senderId: 'user_004',
      receiverId: 'session_group_001',
      content: '有人研究过 Vue 3 的响应式原理吗？',
      type: 'text',
      status: 'read',
      timestamp: Date.now() - 1800000,
      isRead: false,
      isRecalled: false
    }
  }
]

export const mockMessages: Record<string, Message[]> = {
  'session_single_001': generateMessages(['current_user_001', 'user_001'], 'session_single_001', 50),
  'session_single_002': generateMessages(['current_user_001', 'user_002'], 'session_single_002', 30),
  'session_group_001': generateMessages(
    ['current_user_001', 'user_001', 'user_002', 'user_003', 'user_004'],
    'session_group_001',
    100
  )
}
