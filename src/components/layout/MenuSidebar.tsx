'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

interface MenuSidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function MenuSidebar({ isOpen, setIsOpen }: MenuSidebarProps) {
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuthStore()
  const supabase = createClient()

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const menuButton = document.getElementById('menu-button')
        if (menuButton && !menuButton.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    setIsOpen(false)
    router.push('/')
  }

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* User Info */}
            {user && (
              <div className="px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <div className="py-2">
              <Link
                href="/raffles"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">🎟️</span>
                <span>Rifas Ativas</span>
              </Link>
              
              {user && (
                <Link
                  href="/my-tickets"
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">🎫</span>
                  <span>Meus Títulos</span>
                </Link>
              )}
              
              <Link
                href="/winners"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">🏆</span>
                <span>Ganhadores</span>
              </Link>
            </div>

            {/* User Options */}
            {user && (
              <div className="py-2 border-t border-border">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">📊</span>
                  <span>Meu Painel</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">👤</span>
                  <span>Meu Perfil</span>
                </Link>
                <Link
                  href="/my-raffles"
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">🎯</span>
                  <span>Minhas Rifas</span>
                </Link>
                <Link
                  href="/transactions"
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">💳</span>
                  <span>Transações</span>
                </Link>
              </div>
            )}

            {/* Support & Legal */}
            <div className="py-2 border-t border-border">
              <Link
                href="/support"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">💬</span>
                <span>Suporte</span>
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">❓</span>
                <span>Perguntas Frequentes</span>
              </Link>
              <Link
                href="/terms"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">📜</span>
                <span>Termos de Uso</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                onClick={handleLinkClick}
              >
                <span className="text-xl">🔒</span>
                <span>Política de Privacidade</span>
              </Link>
            </div>

            {/* Auth Actions */}
            <div className="py-2 border-t border-border">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  <span>Sair</span>
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    onClick={handleLinkClick}
                  >
                    <span className="text-xl">🔑</span>
                    <span>Entrar</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    onClick={handleLinkClick}
                  >
                    <span className="text-xl">📝</span>
                    <span>Cadastrar</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}