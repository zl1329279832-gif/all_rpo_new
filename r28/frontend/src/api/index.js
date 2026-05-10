import request from '@/utils/request'

export const authApi = {
  login(data) {
    return request.post('/auth/login', data)
  }
}

export const userApi = {
  getList() {
    return request.get('/users')
  },
  getById(id) {
    return request.get(`/users/${id}`)
  },
  create(data) {
    return request.post('/users', data)
  },
  update(id, data) {
    return request.put(`/users/${id}`, data)
  },
  delete(id) {
    return request.delete(`/users/${id}`)
  }
}

export const serverApi = {
  getList() {
    return request.get('/servers')
  },
  getById(id) {
    return request.get(`/servers/${id}`)
  },
  create(data) {
    return request.post('/servers', data)
  },
  update(id, data) {
    return request.put(`/servers/${id}`, data)
  },
  delete(id) {
    return request.delete(`/servers/${id}`)
  }
}

export const metricApi = {
  report(data) {
    return request.post('/metrics/report', data)
  },
  getByServer(serverId) {
    return request.get(`/metrics/server/${serverId}`)
  },
  getByServerAndRange(serverId, hours = 24) {
    return request.get(`/metrics/server/${serverId}/range`, {
      params: { hours }
    })
  },
  getLatest(serverId) {
    return request.get(`/metrics/server/${serverId}/latest`)
  }
}

export const alertApi = {
  getActive() {
    return request.get('/alerts')
  },
  getStats() {
    return request.get('/alerts/stats')
  },
  getByServer(serverId) {
    return request.get(`/alerts/server/${serverId}`)
  },
  getByStatus(status) {
    return request.get(`/alerts/status/${status}`)
  },
  getByLevel(level) {
    return request.get(`/alerts/level/${level}`)
  },
  getRecent(hours = 24) {
    return request.get('/alerts/recent', {
      params: { hours }
    })
  },
  acknowledge(id) {
    return request.post(`/alerts/${id}/acknowledge`)
  },
  resolve(id) {
    return request.post(`/alerts/${id}/resolve`)
  },
  updateLevel(id, alertLevel) {
    return request.put(`/alerts/${id}/level`, { alertLevel })
  },
  getRules() {
    return request.get('/alerts/rules')
  },
  createRule(data) {
    return request.post('/alerts/rules', data)
  },
  updateRule(id, data) {
    return request.put(`/alerts/rules/${id}`, data)
  },
  deleteRule(id) {
    return request.delete(`/alerts/rules/${id}`)
  }
}
