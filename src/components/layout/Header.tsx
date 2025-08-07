'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import MenuSidebar from './MenuSidebar'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, setUser } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        }
      }
    }
    checkUser()
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container-wrapper">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Menu */}
            <div className="flex items-center flex-1">
              <button
                id="menu-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center">
                <img 
                  src="/logo-rt.png" 
                  alt="RT da Sorte" 
                  className="h-12 w-auto object-contain drop-shadow-md"
                  style={{ maxHeight: '48px' }}
                />
              </Link>
            </div>

            {/* Right Side - Cart */}
            <div className="flex items-center justify-end flex-1">
              <CartButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Menu Sidebar */}
      <MenuSidebar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </>
  )
}

function CartButton() {
  const { getTotalItems, toggleCart } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <button
      id="cart-button"
      onClick={toggleCart}
      className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
      aria-label="Carrinho"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  )
}