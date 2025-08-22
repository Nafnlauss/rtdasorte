/**
 * Adaptador de armazenamento local temporário
 * Usado quando o Supabase não está configurado corretamente
 */

export class LocalStorageAdapter {
  private storageKey = 'raffle_system_data'

  private getData() {
    if (typeof window === 'undefined') return { raffles: [], users: [], transactions: [] }
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : { raffles: [], users: [], transactions: [] }
  }

  private saveData(data: any) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  async createRaffle(raffleData: any) {
    const data = this.getData()
    const newRaffle = {
      ...raffleData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.raffles.push(newRaffle)
    this.saveData(data)
    
    console.log('Rifa criada localmente:', newRaffle)
    return { data: [newRaffle], error: null }
  }

  async getRaffles() {
    const data = this.getData()
    return { data: data.raffles, error: null }
  }

  async updateRaffle(id: string, updates: any) {
    const data = this.getData()
    const index = data.raffles.findIndex((r: any) => r.id === id)
    if (index !== -1) {
      data.raffles[index] = {
        ...data.raffles[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.saveData(data)
      return { data: [data.raffles[index]], error: null }
    }
    return { data: null, error: { message: 'Rifa não encontrada' } }
  }

  async deleteRaffle(id: string) {
    const data = this.getData()
    const index = data.raffles.findIndex((r: any) => r.id === id)
    if (index !== -1) {
      const deleted = data.raffles.splice(index, 1)
      this.saveData(data)
      return { data: deleted, error: null }
    }
    return { data: null, error: { message: 'Rifa não encontrada' } }
  }
}

export const localStorageAdapter = new LocalStorageAdapter()