import Mock from 'mockjs'
import { setupUserMock } from './user'
import { setupStationMock, stations } from './station'
import { setupDeviceMock } from './device'
import { setupOrderMock } from './order'
import { setupAlarmMock } from './alarm'
import { setupPriceMock } from './price'
import { setupDashboardMock, setupReportMock } from './dashboard'

Mock.setup({
  timeout: '200-600'
})

export function setupMock() {
  setupUserMock()
  setupStationMock()
  const { devices } = setupDeviceMock(stations)
  const { orders } = setupOrderMock(stations, devices)
  const { alarms } = setupAlarmMock(devices)
  setupPriceMock()
  setupDashboardMock(stations, devices, orders, alarms)
  setupReportMock(orders)
}
