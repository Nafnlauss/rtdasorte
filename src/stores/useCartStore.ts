import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  raffleId: string
  raffleTitle: string
  raffleImage?: string
  numbers: number[]
  pricePerNumber: number
  totalPrice: number
  createdAt: Date
  status: 'pending' | 'reserved' | 'expired'
  expiresAt?: Date
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'createdAt' | 'status'>) => void
  removeItem: (raffleId: string) => void
  updateItemNumbers: (raffleId: string, numbers: number[]) => void
  clearCart: () => void
  clearExpired: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  setIsOpen: (isOpen: boolean) => void
  toggleCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => set((state) => {
        // Remove item existente da mesma rifa se houver
        const filteredItems = state.items.filter(i => i.raffleId !== item.raffleId)
        
        return {
          items: [...filteredItems, {
            ...item,
            createdAt: new Date(),
            status: 'pending',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
          }]
        }
      }),

      removeItem: (raffleId) => set((state) => ({
        items: state.items.filter(item => item.raffleId !== raffleId)
      })),

      updateItemNumbers: (raffleId, numbers) => set((state) => ({
        items: state.items.map(item => 
          item.raffleId === raffleId 
            ? {
                ...item,
                numbers,
                totalPrice: numbers.length * item.pricePerNumber,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Resetar tempo
              }
            : item
        )
      })),

      clearCart: () => set({ items: [] }),

      clearExpired: () => set((state) => ({
        items: state.items.filter(item => {
          if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
            return false
          }
          return true
        })
      })),

      getTotalItems: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.numbers.length, 0)
      },

      getTotalPrice: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.totalPrice, 0)
      },

      setIsOpen: (isOpen) => set({ isOpen }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen }))
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }) // Persiste apenas os items
    }
  )
)