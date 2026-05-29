export type RoomStatus = 'normal' | 'full' | 'maintenance' | 'closed' | 'available' | 'disabled'

export type OrderStatus = 'pending' | 'confirmed' | 'checkedIn' | 'checkedOut' | 'cancelled' | 'noShow'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type ChannelType = 'direct' | 'otc' | 'online' | 'corporate' | 'travelAgent' | 'ota'

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'platinum' | 'diamond'

export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'closed'

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface RoomType {
  id: string
  name: string
  nameEn: string
  basePrice: number
  weekendPrice: number
  holidayPrice: number
  area: number
  floor: string
  bedType: string
  bedSize: string
  maxGuests: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  facilities: string[]
  description: string
  images: string[]
  status: RoomStatus
  breakfastIncluded: boolean
  cancellationPolicy: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNo: string
  roomTypeId: string
  roomTypeName: string
  roomNumber?: string
  roomNo?: string
  guestName: string
  guestPhone: string
  phone?: string
  guestIdCard?: string
  checkInDate: string
  checkOutDate: string
  nights: number
  adults: number
  children?: number
  channel: ChannelType
  channelName: string
  originalPrice: number
  discount?: number
  actualPrice: number
  totalAmount?: number
  deposit?: number
  paymentStatus: PaymentStatus
  paymentMethod?: string
  status: OrderStatus
  specialRequests?: string
  remarks?: string
  memberId?: string
  createdAt: string
  updatedAt: string
}

export interface PriceStrategy {
  id: string
  name: string
  roomTypeId: string
  roomTypeName: string
  startDate: string
  endDate: string
  weekdays: number[]
  basePrice: number
  weekendPrice?: number
  holidayPrice?: number
  minStay?: number
  maxStay?: number
  discountRate?: number
  isActive: boolean
  status?: 'active' | 'inactive'
  priority: number
  createdAt: string
  updatedAt: string
}

export interface Channel {
  id: string
  name: string
  code: string
  type: ChannelType
  description?: string
  contactPerson?: string
  contactPhone?: string
  contact?: string
  phone?: string
  commissionRate: number
  settlementPeriod: number
  isActive: boolean
  status?: 'active' | 'inactive'
  orderCount?: number
  revenue?: number
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  memberNo: string
  name: string
  phone: string
  idCard?: string
  email?: string
  level: MemberLevel
  points: number
  totalPoints: number
  consumedAmount: number
  birthday?: string
  registerDate: string
  lastVisitDate?: string
  lastStayDate?: string
  totalVisits: number
  isActive: boolean
  remarks?: string
  preferences?: string[]
  createdAt: string
  updatedAt: string
}

export interface Complaint {
  id: string
  complaintNo: string
  orderId?: string
  guestName: string
  guestPhone: string
  phone?: string
  type: string
  title: string
  content: string
  description?: string
  source?: string
  priority?: Priority
  status: ComplaintStatus
  handler?: string
  handleContent?: string
  handleTime?: string
  resolvedAt?: string
  satisfaction?: number
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  type: ReportType
  date: string
  startDate: string
  endDate: string
  totalRevenue: number
  roomRevenue: number
  otherRevenue: number
  totalOrders: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  avgRoomPrice: number
  revenuePerAvailableRoom: number
  newMembers: number
  complaints: number
  resolvedComplaints: number
  createdAt: string
}

export interface DailyStatus {
  date: string
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  maintenanceRooms: number
  outOfServiceRooms: number
  checkIns: number
  checkOuts: number
  newBookings: number
  cancellations: number
  walkIns: number
  noShows: number
  occupancyRate: number
  avgDailyRate: number
  revenuePerAvailableRoom: number
  totalRevenue: number
  roomTypeId?: string
  roomTypeName?: string
  soldRooms?: number
  occupancy?: number
  price?: number
  updatedAt: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
