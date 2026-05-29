import type {
  RoomType as TRoomType,
  Order as TOrder,
  PriceStrategy as TPriceStrategy,
  Channel as TChannel,
  Member as TMember,
  Complaint as TComplaint,
  Report as TReport,
  DailyStatus as TDailyStatus
} from '../types'

export type { TRoomType, TOrder, TPriceStrategy, TChannel, TMember, TComplaint, TReport, TDailyStatus }

export interface DashboardData {
  occupancy: number
  adr: number
  revpar: number
  totalRevenue: number
  todayCheckIn: number
  todayCheckOut: number
  inHouse: number
  channelShare: {
    name: string
    value: number
  }[]
  cancellationTrend: {
    date: string
    count: number
    rate: number
  }[]
  sevenDayForecast: {
    date: string
    occupancy: number
    revenue: number
  }[]
  recentOrders: TOrder[]
  pendingComplaints: number
  memberArrivals: number
}

export interface ReportData {
  date: string
  occupancy: number
  adr: number
  revpar: number
  revenue: number
  roomRevenue: number
  foodRevenue: number
  otherRevenue: number
  orderCount: number
  checkInCount: number
  checkOutCount: number
  channelBreakdown: {
    channel: string
    revenue: number
    orderCount: number
  }[]
}

const roomTypes: TRoomType[] = [
  {
    id: '1',
    name: '标准间',
    nameEn: 'Standard Room',
    basePrice: 398,
    weekendPrice: 458,
    holidayPrice: 528,
    area: 28,
    floor: '2-5',
    bedType: '双床',
    bedSize: '1.2m*2',
    maxGuests: 2,
    totalRooms: 30,
    availableRooms: 25,
    occupiedRooms: 4,
    maintenanceRooms: 1,
    facilities: ['免费WiFi', '空调', '电视', '独立卫浴', '24小时热水'],
    description: '舒适宽敞的标准间，配备高品质床品',
    images: ['/room1.jpg', '/room1-2.jpg'],
    status: 'normal',
    breakfastIncluded: false,
    cancellationPolicy: '入住前1天可免费取消',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: '大床房',
    nameEn: 'King Room',
    basePrice: 428,
    weekendPrice: 488,
    holidayPrice: 558,
    area: 30,
    floor: '2-6',
    bedType: '大床',
    bedSize: '1.8m*1',
    maxGuests: 2,
    totalRooms: 25,
    availableRooms: 20,
    occupiedRooms: 4,
    maintenanceRooms: 1,
    facilities: ['免费WiFi', '空调', '电视', '独立卫浴', '浴缸'],
    description: '温馨舒适的大床房，适合情侣出行首选',
    images: ['/room2.jpg'],
    status: 'normal',
    breakfastIncluded: true,
    cancellationPolicy: '入住前1天可免费取消',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z'
  },
  {
    id: '3',
    name: '双床房',
    nameEn: 'Twin Room',
    basePrice: 458,
    weekendPrice: 518,
    holidayPrice: 588,
    area: 32,
    floor: '3-6',
    bedType: '双床',
    bedSize: '1.2m*2',
    maxGuests: 3,
    totalRooms: 20,
    availableRooms: 15,
    occupiedRooms: 4,
    maintenanceRooms: 1,
    facilities: ['免费WiFi', '空调', '智能电视', '独立卫浴', '迷你吧'],
    description: '宽敞明亮的双床房，适合家庭或朋友出行',
    images: ['/room3.jpg'],
    status: 'normal',
    breakfastIncluded: true,
    cancellationPolicy: '入住前1天可免费取消',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z'
  },
  {
    id: '4',
    name: '豪华套房',
    nameEn: 'Deluxe Suite',
    basePrice: 888,
    weekendPrice: 988,
    holidayPrice: 1188,
    area: 55,
    floor: '7-8',
    bedType: '特大床',
    bedSize: '2.0m*1',
    maxGuests: 2,
    totalRooms: 10,
    availableRooms: 7,
    occupiedRooms: 2,
    maintenanceRooms: 1,
    facilities: ['免费WiFi', '独立客厅', '智能电视', '按摩浴缸', '行政酒廊', '免费早餐'],
    description: '豪华套房，享受专属礼遇',
    images: ['/room4.jpg'],
    status: 'normal',
    breakfastIncluded: true,
    cancellationPolicy: '入住前2天可免费取消',
    createdAt: '2026-01-20T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z'
  },
  {
    id: '5',
    name: '总统套房',
    nameEn: 'Presidential Suite',
    basePrice: 2888,
    weekendPrice: 3288,
    holidayPrice: 3888,
    area: 120,
    floor: '9',
    bedType: '特大床',
    bedSize: '2.2m*1',
    maxGuests: 4,
    totalRooms: 2,
    availableRooms: 1,
    occupiedRooms: 1,
    maintenanceRooms: 0,
    facilities: ['免费WiFi', '独立客厅', '餐厅', '智能电视', '按摩浴缸', '行政酒廊', '24小时管家服务', '私人泳池'],
    description: '总统套房，尊享极致奢华体验',
    images: ['/room5.jpg'],
    status: 'normal',
    breakfastIncluded: true,
    cancellationPolicy: '入住前3天可免费取消',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z'
  },
  {
    id: '6',
    name: '家庭房',
    nameEn: 'Family Room',
    basePrice: 688,
    weekendPrice: 788,
    holidayPrice: 888,
    area: 45,
    floor: '4-6',
    bedType: '大床+单人床',
    bedSize: '1.8m*1 + 1.2m*1',
    maxGuests: 4,
    totalRooms: 8,
    availableRooms: 6,
    occupiedRooms: 2,
    maintenanceRooms: 0,
    facilities: ['免费WiFi', '空调', '智能电视', '独立卫浴', '儿童用品', '迷你吧'],
    description: '温馨家庭房，配备儿童设施',
    images: ['/room6.jpg'],
    status: 'normal',
    breakfastIncluded: true,
    cancellationPolicy: '入住前1天可免费取消',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z'
  }
]

const orders: TOrder[] = [
  {
    id: '1',
    orderNo: 'ORD20260529001',
    roomTypeId: '1',
    roomTypeName: '标准间',
    roomNumber: '201',
    guestName: '张三',
    guestPhone: '13800138001',
    guestIdCard: '110101199001011234',
    checkInDate: '2026-05-29',
    checkOutDate: '2026-05-31',
    nights: 2,
    adults: 2,
    children: 0,
    channel: 'online',
    channelName: '携程',
    originalPrice: 796,
    discount: 0,
    actualPrice: 796,
    deposit: 200,
    paymentStatus: 'paid',
    paymentMethod: '微信支付',
    status: 'confirmed',
    specialRequests: '需要安静的房间',
    remarks: '',
    memberId: '1',
    createdAt: '2026-05-28T14:30:00.000Z',
    updatedAt: '2026-05-28T14:30:00.000Z'
  },
  {
    id: '2',
    orderNo: 'ORD20260529002',
    roomTypeId: '2',
    roomTypeName: '大床房',
    roomNumber: '305',
    guestName: '李四',
    guestPhone: '13800138002',
    guestIdCard: '310101198505055678',
    checkInDate: '2026-05-28',
    checkOutDate: '2026-06-01',
    nights: 4,
    adults: 2,
    children: 1,
    channel: 'online',
    channelName: '美团',
    originalPrice: 1712,
    discount: 100,
    actualPrice: 1612,
    deposit: 500,
    paymentStatus: 'paid',
    paymentMethod: '支付宝',
    status: 'checkedIn',
    specialRequests: '有小孩，需要儿童用品',
    remarks: 'VIP客人',
    memberId: '2',
    createdAt: '2026-05-26T10:00:00.000Z',
    updatedAt: '2026-05-28T15:30:00.000Z'
  }
]

for (let i = 3; i <= 100; i++) {
  const roomTypeIndex = (i % 6)
  const statuses: TOrder['status'][] = ['pending', 'confirmed', 'checkedIn', 'checkedOut', 'cancelled', 'noShow']
  const channels: TOrder['channel'][] = ['online', 'direct', 'otc', 'corporate', 'travelAgent']
  const channelNames = ['携程', '美团', '飞猪', '去哪儿', 'Booking', 'Agoda', '官网', '微信小程序']
  const names = ['陈', '林', '黄', '周', '吴', '郑', '王', '李', '张', '刘']
  const givenNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '军']

  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + (i % 10 - 5))
  const nights = 1 + (i % 5)
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + nights)

  orders.push({
    id: String(i),
    orderNo: `ORD20260529${String(i).padStart(3, '0')}`,
    roomTypeId: String(roomTypeIndex + 1),
    roomTypeName: roomTypes[roomTypeIndex].name,
    roomNumber: `${100 + i}`,
    guestName: `${names[i % 10]}${givenNames[(i + 3) % 10]}`,
    guestPhone: `138${String(10000000 + i).slice(-8)}`,
    guestIdCard: `110101${1980 + (i % 20)}${String((i * 3) % 12 + 1).padStart(2, '0')}${String((i * 5) % 28 + 1).padStart(2, '0')}${String(1000 + i).slice(-4)}`,
    checkInDate: checkIn.toISOString().split('T')[0],
    checkOutDate: checkOut.toISOString().split('T')[0],
    nights,
    adults: 1 + (i % 3),
    children: i % 4 === 0 ? 1 : 0,
    channel: channels[i % 5],
    channelName: channelNames[i % 8],
    originalPrice: roomTypes[roomTypeIndex].basePrice * nights,
    discount: i % 3 === 0 ? 50 + (i % 10) * 10 : 0,
    actualPrice: roomTypes[roomTypeIndex].basePrice * nights - (i % 3 === 0 ? 50 + (i % 10) * 10 : 0),
    deposit: 200 + (i % 5) * 100,
    paymentStatus: ['unpaid', 'partial', 'paid', 'refunded'][i % 4] as TOrder['paymentStatus'],
    paymentMethod: ['微信支付', '支付宝', '信用卡', '现金'][i % 4],
    status: statuses[i % 6],
    specialRequests: i % 5 === 0 ? '需要安静房间' : '',
    remarks: '',
    memberId: i % 3 === 0 ? String((i % 50) + 1) : '',
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - i * 1800000).toISOString()
  })
}

const priceStrategies: TPriceStrategy[] = [
  {
    id: '1',
    name: '旺季价格调整',
    roomTypeId: '1',
    roomTypeName: '标准间',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    weekdays: [1, 2, 3, 4, 5],
    basePrice: 458,
    weekendPrice: 528,
    holidayPrice: 598,
    minStay: 1,
    maxStay: 30,
    discountRate: 0,
    isActive: true,
    priority: 1,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: '淡季特惠',
    roomTypeId: '2',
    roomTypeName: '大床房',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    weekdays: [1, 2, 3, 4, 5],
    basePrice: 358,
    weekendPrice: 398,
    holidayPrice: 458,
    minStay: 2,
    maxStay: 30,
    discountRate: 15,
    isActive: true,
    priority: 2,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z'
  }
]

for (let i = 3; i <= 15; i++) {
  priceStrategies.push({
    id: String(i),
    name: ['周末促销', '节假日加价', '会员专享', '长住优惠', '提前预订', '商务协议', '家庭套餐', '新婚特惠', '国庆黄金周', '钟点房', '连住优惠'][i % 11],
    roomTypeId: String(((i - 1) % 6) + 1),
    roomTypeName: roomTypes[((i - 1) % 6)].name,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    weekdays: i % 2 === 0 ? [1, 2, 3, 4, 5] : [0, 6],
    basePrice: 300 + i * 30,
    weekendPrice: 350 + i * 30,
    holidayPrice: 400 + i * 30,
    minStay: 1 + (i % 3),
    maxStay: 30,
    discountRate: i * 2,
    isActive: i % 5 !== 0,
    priority: i,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  })
}

const channels: TChannel[] = [
  {
    id: '1',
    name: '携程',
    code: 'CTRIP',
    type: 'online',
    description: '国内最大的在线旅游平台',
    contactPerson: '张经理',
    contactPhone: '400-820-6666',
    commissionRate: 12,
    settlementPeriod: 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: '美团',
    code: 'MEITUAN',
    type: 'online',
    description: '本地生活服务平台',
    contactPerson: '李经理',
    contactPhone: '400-660-5335',
    commissionRate: 10,
    settlementPeriod: 3,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  }
]

for (let i = 3; i <= 8; i++) {
  const channelData = [
    { name: '飞猪', code: 'FLIGGY', type: 'online' as const, rate: 8 },
    { name: '去哪儿', code: 'QUNAR', type: 'online' as const, rate: 9 },
    { name: 'Booking', code: 'BOOKING', type: 'otc' as const, rate: 15 },
    { name: 'Agoda', code: 'AGODA', type: 'otc' as const, rate: 14 },
    { name: '官网', code: 'OFFICIAL', type: 'direct' as const, rate: 0 },
    { name: '微信小程序', code: 'WECHAT', type: 'direct' as const, rate: 0 }
  ]
  const data = channelData[i - 3]
  channels.push({
    id: String(i),
    name: data.name,
    code: data.code,
    type: data.type,
    description: `${data.name}渠道`,
    contactPerson: `${['王', '赵', '刘', '陈', '杨', '黄'][i - 3]}经理`,
    contactPhone: `400-${100 + i * 100}-${1000 + i * 100}`,
    commissionRate: data.rate,
    settlementPeriod: data.rate === 0 ? 1 : 7,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z'
  })
}

const members: TMember[] = []

for (let i = 1; i <= 50; i++) {
  const levels: TMember['level'][] = ['normal', 'silver', 'gold', 'platinum', 'diamond']
  const names = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const givenNames = ['明', '华', '丽', '强', '芳', '军', '敏', '静', '杰', '涛']

  members.push({
    id: String(i),
    memberNo: `VIP2026${String(i).padStart(4, '0')}`,
    name: `${names[i % 10]}${givenNames[(i + 2) % 10]}`,
    phone: `139${String(10000000 + i).slice(-8)}`,
    idCard: `320101${1975 + (i % 25)}${String((i * 4) % 12 + 1).padStart(2, '0')}${String((i * 6) % 28 + 1).padStart(2, '0')}${String(2000 + i).slice(-4)}`,
    email: `member${i}@example.com`,
    level: levels[i % 5],
    points: 1000 + (i * 150) % 30000,
    totalPoints: 2000 + (i * 200) % 40000,
    consumedAmount: 5000 + (i * 1000) % 200000,
    birthday: `${1970 + (i % 30)}-${String((i * 5) % 12 + 1).padStart(2, '0')}-${String((i * 7) % 28 + 1).padStart(2, '0')}`,
    registerDate: `${2020 + (i % 6)}-${String((i * 3) % 12 + 1).padStart(2, '0')}-01`,
    lastVisitDate: new Date(Date.now() - (i % 90) * 86400000).toISOString().split('T')[0],
    totalVisits: 1 + (i * 3) % 100,
    isActive: i % 20 !== 0,
    remarks: i % 4 === 0 ? '商务出行' : i % 4 === 1 ? '家庭出行' : i % 4 === 2 ? '休闲度假' : '其他',
    createdAt: new Date(Date.now() - i * 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000 * 7).toISOString()
  })
}

const complaints: TComplaint[] = []
const complaintTypes = ['卫生', '服务', '设施', '噪音', '其他']
const complaintStatuses: TComplaint['status'][] = ['pending', 'processing', 'resolved', 'closed']

for (let i = 1; i <= 30; i++) {
  const created = new Date(Date.now() - (i * 24 * 3600000))
  const names = ['周', '吴', '郑', '王', '李', '张', '刘', '陈', '杨', '黄']
  const givenNames = ['明', '华', '丽', '强', '芳', '军', '敏', '静', '杰', '涛']
  const handlers = ['王经理', '李主管', '张主管', '刘经理', '陈经理']
  const titles = [
    '热水供应不稳定', '电梯故障', '停车位不足', '早餐品种太少', '网络信号差',
    '隔音效果不好', '枕头太硬', '毛巾不干净', '空调温度调节不灵敏', '电视无法使用',
    '马桶堵塞', '淋浴水太小', '房间有蟑螂', '窗外噪音大', '服务态度不好'
  ]

  complaints.push({
    id: String(i),
    complaintNo: `CMP2026${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}${String(i).padStart(3, '0')}`,
    orderId: i % 3 === 0 ? String((i % 100) + 1) : undefined,
    guestName: `${names[i % 10]}${givenNames[(i + 1) % 10]}`,
    guestPhone: `137${String(10000000 + i).slice(-8)}`,
    type: complaintTypes[i % 5],
    title: titles[i % 15],
    content: `客人反映${titles[i % 15]}，要求尽快处理。`,
    status: complaintStatuses[i % 4],
    handler: i % 4 !== 0 ? handlers[i % 5] : undefined,
    handleContent: i % 4 !== 0 ? `已与客人沟通，${['安排维修人员检查', '赠送免费早餐', '给予折扣优惠', '升级房型'][i % 4]}` : undefined,
    handleTime: i % 4 !== 0 ? new Date(created.getTime() + 3600000).toISOString() : undefined,
    satisfaction: i % 4 === 2 ? 3 + ((i % 3) + 1) : undefined,
    createdAt: created.toISOString(),
    updatedAt: new Date(created.getTime() + 7200000).toISOString()
  })
}

const reports: TReport[] = []

for (let i = 0; i < 12; i++) {
  const month = new Date(2026, 0, 1)
  month.setMonth(month.getMonth() + i)
  const daysInMonth = new Date(2026, i + 1, 0).getDate()
  const baseOccupancy = 55 + Math.floor(Math.random() * 35)
  const baseADR = 380 + Math.floor(Math.random() * 250)

  reports.push({
    id: String(i + 1),
    type: 'monthly',
    date: `2026-${String(i + 1).padStart(2, '0')}`,
    startDate: `2026-${String(i + 1).padStart(2, '0')}-01`,
    endDate: `2026-${String(i + 1).padStart(2, '0')}-${daysInMonth}`,
    totalRevenue: 800000 + Math.floor(Math.random() * 1500000),
    roomRevenue: 600000 + Math.floor(Math.random() * 1000000),
    otherRevenue: 200000 + Math.floor(Math.random() * 500000),
    totalOrders: 800 + Math.floor(Math.random() * 1200),
    occupiedRooms: Math.floor(baseOccupancy * 95 / 100),
    availableRooms: 95 - Math.floor(baseOccupancy * 95 / 100),
    occupancyRate: baseOccupancy,
    avgRoomPrice: baseADR,
    revenuePerAvailableRoom: Math.floor(baseADR * baseOccupancy / 100),
    newMembers: 30 + Math.floor(Math.random() * 70),
    complaints: 5 + Math.floor(Math.random() * 25),
    resolvedComplaints: 4 + Math.floor(Math.random() * 23),
    createdAt: new Date(2026, i, daysInMonth).toISOString()
  })
}

const generateDailyStatus = (): TDailyStatus[] => {
  const result: TDailyStatus[] = []
  const today = new Date()
  const totalRooms = 95

  for (let i = -30; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()

    let baseOccupancy = 55 + Math.floor(Math.random() * 40)

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      baseOccupancy = Math.min(98, baseOccupancy + 15)
    }

    const isFullHouse = i >= 0 && i <= 2
    if (isFullHouse) {
      baseOccupancy = 98 + Math.floor(Math.random() * 2)
    }

    const isCancellationSurge = i === -3
    const cancellations = isCancellationSurge ? 15 + Math.floor(Math.random() * 10) : 2 + Math.floor(Math.random() * 8)

    const occupiedRooms = Math.floor(totalRooms * baseOccupancy / 100)

    result.push({
      date: dateStr,
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms - 2,
      maintenanceRooms: 2,
      outOfServiceRooms: 0,
      checkIns: Math.floor(occupiedRooms * 0.4),
      checkOuts: Math.floor(occupiedRooms * 0.38),
      newBookings: Math.floor(occupiedRooms * 0.5),
      cancellations,
      walkIns: Math.floor(Math.random() * 10),
      noShows: Math.floor(Math.random() * 3),
      occupancyRate: baseOccupancy,
      avgDailyRate: 380 + Math.floor(Math.random() * 300),
      revenuePerAvailableRoom: Math.floor((380 + Math.floor(Math.random() * 300)) * baseOccupancy / 100),
      totalRevenue: 15000 + Math.floor(Math.random() * 30000),
      updatedAt: new Date().toISOString()
    })
  }
  return result
}

const generateReportData = (): ReportData[] => {
  const result: ReportData[] = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i - 29)
    const occupancy = 40 + Math.floor(Math.random() * 50)
    const adr = 350 + Math.floor(Math.random() * 300)

    result.push({
      date: date.toISOString().split('T')[0],
      occupancy,
      adr,
      revpar: Math.round(adr * occupancy / 100),
      revenue: 20000 + Math.floor(Math.random() * 30000),
      roomRevenue: 15000 + Math.floor(Math.random() * 20000),
      foodRevenue: 3000 + Math.floor(Math.random() * 8000),
      otherRevenue: 2000 + Math.floor(Math.random() * 5000),
      orderCount: 30 + Math.floor(Math.random() * 40),
      checkInCount: 15 + Math.floor(Math.random() * 25),
      checkOutCount: 15 + Math.floor(Math.random() * 25),
      channelBreakdown: channels.map(c => ({
        channel: c.name,
        revenue: Math.floor(Math.random() * 15000),
        orderCount: Math.floor(Math.random() * 20)
      }))
    })
  }
  return result
}

const generateDashboardData = (): DashboardData => {
  return {
    occupancy: 72,
    adr: 458,
    revpar: 330,
    totalRevenue: 186500,
    todayCheckIn: 28,
    todayCheckOut: 25,
    inHouse: 156,
    channelShare: [
      { name: '携程', value: 35 },
      { name: '美团', value: 28 },
      { name: '飞猪', value: 15 },
      { name: '去哪儿', value: 10 },
      { name: '官网', value: 7 },
      { name: '微信小程序', value: 5 }
    ],
    cancellationTrend: Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 13 + i)
      const isSurge = i === 10
      return {
        date: d.toISOString().split('T')[0],
        count: isSurge ? 18 + Math.floor(Math.random() * 5) : 2 + Math.floor(Math.random() * 8),
        rate: isSurge ? 12 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 5)
      }
    }),
    sevenDayForecast: Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().split('T')[0],
        occupancy: i < 3 ? 95 + Math.floor(Math.random() * 4) : 50 + Math.floor(Math.random() * 40),
        revenue: 15000 + Math.floor(Math.random() * 20000)
      }
    }),
    recentOrders: orders.slice(0, 10),
    pendingComplaints: complaints.filter(c => c.status === 'pending').length,
    memberArrivals: 5
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const randomDelay = () => delay(300 + Math.floor(Math.random() * 500))

const randomError = () => {
  if (Math.random() < 0.05) {
    throw new Error('服务器繁忙，请稍后重试')
  }
}

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

export const mockLoaders = {
  getRoomTypes: (): TRoomType[] => getFromStorage('roomTypes', roomTypes),
  setRoomTypes: (data: TRoomType[]) => setToStorage('roomTypes', data),
  getDailyStatus: (): TDailyStatus[] => getFromStorage('dailyStatus', generateDailyStatus()),
  setDailyStatus: (data: TDailyStatus[]) => setToStorage('dailyStatus', data),
  getOrders: (): TOrder[] => getFromStorage('orders', orders),
  setOrders: (data: TOrder[]) => setToStorage('orders', data),
  getPriceStrategies: (): TPriceStrategy[] => getFromStorage('priceStrategies', priceStrategies),
  setPriceStrategies: (data: TPriceStrategy[]) => setToStorage('priceStrategies', data),
  getChannels: (): TChannel[] => getFromStorage('channels', channels),
  setChannels: (data: TChannel[]) => setToStorage('channels', data),
  getMembers: (): TMember[] => getFromStorage('members', members),
  setMembers: (data: TMember[]) => setToStorage('members', data),
  getComplaints: (): TComplaint[] => getFromStorage('complaints', complaints),
  setComplaints: (data: TComplaint[]) => setToStorage('complaints', data),
  getReports: (): TReport[] => getFromStorage('reports', reports),
  setReports: (data: TReport[]) => setToStorage('reports', data),
  getReportData: (): ReportData[] => getFromStorage('reportData', generateReportData()),
  setReportData: (data: ReportData[]) => setToStorage('reportData', data),
  getDashboardData: (): DashboardData => getFromStorage('dashboardData', generateDashboardData()),
  setDashboardData: (data: DashboardData) => setToStorage('dashboardData', data),
  delay: randomDelay,
  randomError
}
