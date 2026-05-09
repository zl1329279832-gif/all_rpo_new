const API_BASE = '/api'

export const api = {
  async createRoom(name, description = '') {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description, createdBy: 'anonymous' })
    })
    return response.json()
  },

  async getRoom(roomId) {
    const response = await fetch(`${API_BASE}/rooms/${roomId}`)
    if (!response.ok) {
      throw new Error('Room not found')
    }
    return response.json()
  },

  async getRoomInitialData(roomId, userId = '') {
    const url = userId 
      ? `${API_BASE}/rooms/${roomId}/init?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/rooms/${roomId}/init`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Room not found')
    }
    return response.json()
  },

  async getAllRooms() {
    const response = await fetch(`${API_BASE}/rooms`)
    return response.json()
  },

  async updateRoom(roomId, data, userId = '') {
    const url = userId 
      ? `${API_BASE}/rooms/${roomId}?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/rooms/${roomId}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error('Permission denied or room not found')
    }
    return response.json()
  },

  async getUserPermissions(roomId, userId = '') {
    const url = userId
      ? `${API_BASE}/rooms/${roomId}/permissions?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/rooms/${roomId}/permissions`
    const response = await fetch(url)
    return response.json()
  },

  async getRoomMembers(roomId, userId = '') {
    const url = userId
      ? `${API_BASE}/rooms/${roomId}/members?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/rooms/${roomId}/members`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Permission denied')
    }
    return response.json()
  },

  async inviteMember(roomId, targetUserId, username, role = 'VIEWER', requesterId = '') {
    const url = requesterId
      ? `${API_BASE}/rooms/${roomId}/members/invite?requesterId=${encodeURIComponent(requesterId)}`
      : `${API_BASE}/rooms/${roomId}/members/invite`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: targetUserId,
        username,
        role
      })
    })
    if (!response.ok) {
      throw new Error('Permission denied')
    }
    return response.json()
  },

  async updateMemberRole(roomId, targetUserId, role, requesterId = '') {
    const url = requesterId
      ? `${API_BASE}/rooms/${roomId}/members/${encodeURIComponent(targetUserId)}/role?requesterId=${encodeURIComponent(requesterId)}`
      : `${API_BASE}/rooms/${roomId}/members/${encodeURIComponent(targetUserId)}/role`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    })
    if (!response.ok) {
      throw new Error('Permission denied')
    }
    return response.json()
  },

  async removeMember(roomId, targetUserId, requesterId = '') {
    const url = requesterId
      ? `${API_BASE}/rooms/${roomId}/members/${encodeURIComponent(targetUserId)}?requesterId=${encodeURIComponent(requesterId)}`
      : `${API_BASE}/rooms/${roomId}/members/${encodeURIComponent(targetUserId)}`
    const response = await fetch(url, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('Permission denied')
    }
    return response.ok
  }
}
