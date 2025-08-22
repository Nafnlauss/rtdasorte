'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import DebugLogger from '@/components/DebugLogger'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Fechado por padrão em mobile
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated as admin
    const checkAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin')
      const adminEmail = localStorage.getItem('adminEmail')
      
      if (!isAdmin || adminEmail !== 'slimc215@gmail.com') {
        router.push('/admin/login')
      } else {
        setIsLoading(false)
      }
    }
    
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false)
    } else {
      checkAuth()
    }
  }, [pathname, router])

  // Fechar sidebar ao navegar em mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Show nothing while checking auth (except for login page)
  if (isLoading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Don't show admin layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: '📊',
    },
    {
      title: 'Rifas',
      href: '/admin/raffles',
      icon: '🎟️',
    },
    {
      title: 'Nova Rifa',
      href: '/admin/raffles/new',
      icon: '➕',
    },
    {
      title: 'Usuários',
      href: '/admin/users',
      icon: '👥',
    },
    {
      title: 'Transações',
      href: '/admin/transactions',
      icon: '💰',
    },
    {
      title: 'Ganhadores',
      href: '/admin/winners',
      icon: '🏆',
    },
    {
      title: 'Configurações',
      href: '/admin/settings',
      icon: '⚙️',
    },
  ]

  const handleMenuClick = () => {
    // Fechar menu em mobile após clicar
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="h-full w-64 sm:w-72 md:w-64 bg-card border-r border-border overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
            <h2 className="text-lg sm:text-xl font-bold text-gradient">Painel Admin</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-foreground hover:text-primary p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleMenuClick}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="text-sm sm:text-base font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-border space-y-2 bg-card">
            <button
              onClick={() => {
                localStorage.removeItem('isAdmin')
                localStorage.removeItem('adminEmail')
                router.push('/admin/login')
              }}
              className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
            <Link
              href="/"
              onClick={handleMenuClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Voltar ao Site</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''} md:ml-64`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-foreground hover:text-primary p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Administrador</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 min-h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Debug Logger (only in development) */}
      <DebugLogger />
    </div>
  )
}