import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Nav({ user, isCollapsed, setIsCollapsed, mobileOverlay = false, onClose }) {
  const router = useRouter()
  const [lang, setLang] = useState('id')
  useEffect(()=>{ try { const l = localStorage.getItem('lang') || 'id'; setLang(l) } catch {} }, [])
  const NAME_MAP = {
    'kent@machazen.id': 'Kent Susanto',
    'bukanalden@gmail.com': 'Joshua Alden',
    'jersy_istri@zhongli.com': 'Jersy Liora',
    'leenciaaa@gmail.com': 'Patricia Aileen',
    'lauren@machazen.id': 'Laurencia Aurelia Calysta'
  }
  const displayName = user?.email && NAME_MAP[user.email] ? NAME_MAP[user.email] : user?.email
  const navItems = [
    { label: '📊', href: '/dashboard', icon: '📊', iconImg: '/images/dashboard.svg' },
    { label: '📦', href: '/stock', icon: '📦', iconImg: '/images/stock.svg' },
    { label: '🏷️', href: '/products', icon: '🏷️', iconImg: '/images/price.svg' },
    { label: '💰', href: '/finance', icon: '💰', iconImg: '/images/finance.svg' },
    { label: '🧮', href: '/calculator', icon: '🧮', iconImg: '/images/calculator.svg' },
    { label: '📜', href: '/logs', icon: '📜', iconImg: '/images/logs.svg' },
    { label: '🛒', href: '/sales', icon: '🛒', iconImg: '/images/sales.svg' },
    { label: '🧾', href: '/notes', icon: '🧾', iconImg: '/images/buy.svg' },
    { label: '⚙️', href: '/settings', icon: '⚙️', iconImg: '/images/settings.svg' },
  ]
  const LABELS = {
    '/dashboard': { id: 'Dashboard', en: 'Dashboard' },
    '/stock': { id: 'Stok', en: 'Stock' },
    '/products': { id: 'Produk', en: 'Products' },
    '/finance': { id: 'Keuangan', en: 'Finance' },
    '/calculator': { id: 'Kalkulator', en: 'Calculator' },
    '/logs': { id: 'Logs', en: 'Logs' },
    '/sales': { id: 'Penjualan', en: 'Sales' },
    '/notes': { id: 'Pembelian', en: 'Purchases' },
    '/settings': { id: 'Pengaturan', en: 'Settings' },
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function generateReport(e) {
    e.stopPropagation()
    const res = await fetch('/api/reports/generate')
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Laporan_Machazen.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <nav
      style={{
        background: 'linear-gradient(180deg, #2e7d32 0%, #558b2f 100%)',
        width: mobileOverlay ? '100vw' : (isCollapsed ? '80px' : '256px'),
        transition: 'width 0.3s ease',
        position: mobileOverlay ? 'fixed' : 'relative',
        zIndex: 50,
        top: mobileOverlay ? 0 : 'auto',
        left: mobileOverlay ? 0 : 'auto',
        height: mobileOverlay ? '100vh' : 'auto'
      }}
      className={`text-white ${mobileOverlay ? '' : 'min-h-screen'} shadow-lg overflow-auto`}
    >
      <div className={isCollapsed ? 'p-2' : 'p-6'}>
        <div className="mb-8 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <img src="/images/machazen-logo-dashboard.png" alt="Machazen Logo" className="w-12 h-12 mr-2 object-contain max-w-none" />
              <h1 className="text-xl font-bold">MACHAZEN.ID</h1>
            </div>
          )}
          {isCollapsed && (
            <img
              src="/images/machazen-logo-dashboard.png"
              alt="Machazen Logo"
              className="w-12 h-12 object-contain max-w-none mx-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setIsCollapsed(false)
              }}
            />
          )}
          {mobileOverlay && (
            <button onClick={(e)=>{ e.stopPropagation(); if(onClose) onClose() }} className="text-white text-2xl">✕</button>
          )}
        </div>
        <div className="space-y-2 mb-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-3 rounded transition ${
                router.pathname === item.href ? 'bg-white text-green-700' : 'hover:bg-green-600'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {item.iconImg ? (
                <span style={{ width:20, height:20, display:'inline-block', backgroundColor: router.pathname === item.href ? '#ff4081' : '#ffffff', WebkitMaskImage: `url(${item.iconImg})`, maskImage: `url(${item.iconImg})`, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
              ) : (
                <span className="text-lg">{item.icon}</span>
              )}
              {!isCollapsed && <span className="ml-3">{(LABELS[item.href] ? LABELS[item.href][lang==='en'?'en':'id'] : item.href)}</span>}
            </a>
          ))}
        </div>
        <div className="border-t pt-4">
          {!isCollapsed && <div className="text-sm mb-4">{displayName}</div>}
          {user?.email === 'kent@machazen.id' && (
            <button
              onClick={generateReport}
              className={`mb-3 ${isCollapsed ? 'w-12' : 'w-full'} bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition flex items-center justify-center`}
            >
              {isCollapsed ? <img src="/images/reportgen.svg" alt="Generate" className="w-5 h-5" /> : 'Generate Laporan'}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              logout()
            }}
            className={`bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition ${isCollapsed ? 'w-12' : 'w-full'}`}
          >
            {isCollapsed ? <img src="/images/logout.svg" alt="Keluar" className="w-5 h-5 mx-auto" /> : 'Keluar'}
          </button>
        </div>
      </div>
    </nav>
  )
}
