import type { MockMethod } from 'vite-plugin-mock'
import userMock from './user'
import overviewMock from './overview'
import departmentMock from './department'
import doctorMock from './doctor'
import bedMock from './bed'
import costMock from './cost'
import appointmentMock from './appointment'
import alertMock from './alert'
import reportMock from './report'

const mockList: MockMethod[] = [
  ...userMock,
  ...overviewMock,
  ...departmentMock,
  ...doctorMock,
  ...bedMock,
  ...costMock,
  ...appointmentMock,
  ...alertMock,
  ...reportMock,
]

export default mockList
