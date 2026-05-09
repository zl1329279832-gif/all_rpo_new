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

  async getRoomInitialData(roomId) {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/init`)
    if (!response.ok) {
      throw new Error('Room not found')
    }
    return response.json()
  },

  async getAllRooms() {
    const response = await fetch(`${API_BASE}/rooms`)
    return response.json()
  }
}
