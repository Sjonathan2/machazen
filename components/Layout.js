import { useEffect, useState } from 'react'
import Nav from './Nav'

export default function Layout({ user, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sakuraCount, setSakuraCount] = useState(120)
  const [sakuraBase, setSakuraBase] = useState(1.2)

  useEffect(() => {
    function apply() {
      const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : { matches: false }
      setIsMobile(!!mq.matches)
    }
    apply()
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 640px)')
      const handler = () => apply()
      if (mq.addEventListener) mq.addEventListener('change', handler)
      else mq.addListener(handler)
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', handler)
        else mq.removeListener(handler)
      }
    }
  }, [])

  useEffect(()=>{
    const cnt = Math.floor(80 + Math.random()*100)
    const base = 0.9 + Math.random()*1.2
    setSakuraCount(cnt)
    setSakuraBase(base)
  }, [])

  return (
    <div className="min-h-screen layout-root" style={{ background: '#f5f5f5', position:'relative' }}>
      <div className="sakura-bg" aria-hidden="true"></div>
      <div className="sakura" aria-hidden="true">
        {Array.from({ length: sakuraCount }).map((_, i) => {
          const w = sakuraBase * (0.8 + Math.random()*1.2)
          const h = w * (0.4 + Math.random()*0.3)
          const left = Math.random()*100
          const delay = Math.random()*12
          const duration = 5 + Math.random()*10
          const drift = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random()*18)
          const rx = Math.floor(Math.random()*360)
          const ry = Math.floor(Math.random()*360)
          const rz = Math.floor(Math.random()*360)
          return (
            <span key={i} style={{ left: `${left}%`, width: `${w}vw`, height: `${h}vw`, animation: `sakura-var ${duration}s linear infinite`, animationDelay: `${delay}s`, '--drift': `${drift}vw`, '--rx': `${rx}deg`, '--ry': `${ry}deg`, '--rz': `${rz}deg` }}></span>
          )
        })}
      </div>
      {!isMobile && (
        <div className="flex min-h-screen" style={{ position:'relative', zIndex:1 }}>
          <Nav user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <div className="flex-1 p-8" onClick={() => setIsCollapsed(true)}>
            {children}
          </div>
        </div>
      )}

      {isMobile && (
        <div className="min-h-screen" style={{ position:'relative', zIndex:1 }}>
          <header className="flex items-center gap-2 p-3 bg-white shadow">
            <button aria-label="Buka Navigasi" onClick={() => setMobileNavOpen(true)} className="flex items-center">
              <img src="/images/machazen-logo-dashboard.png" alt="Machazen Logo" className="w-9 h-9 object-contain" />
            </button>
            <div className="text-lg font-bold" style={{ color: '#2e7d32' }}>MACHAZEN.ID</div>
          </header>
          <div className="p-4 text-sm">
            {children}
          </div>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50" onClick={() => setMobileNavOpen(false)}>
              <Nav user={user} isCollapsed={false} setIsCollapsed={() => {}} mobileOverlay onClose={() => setMobileNavOpen(false)} />
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        .sakura-bg { position: fixed; left: 0; right: 0; bottom: 0; height: 25vh; z-index: 0; pointer-events: none; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(240,248,255,0.6) 20%, rgba(233,245,233,0.7) 60%, rgba(205,240,215,0.8) 100%); }
        .sakura { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
        .sakura span { position: absolute; top: -10%; left: 0; border-radius: 5% 80% 10% 80%; background-color: #ffb6c1; }
        .sakura span:nth-child(4n+1) { animation-duration: 5s; }
        .sakura span:nth-child(4n+2) { animation-duration: 12s; }
        .sakura span:nth-child(4n+3) { animation-duration: 8s; }
        .sakura span:nth-child(4n+4) { animation-duration: 6s; }
        .sakura span:nth-child(11n+1) { animation-delay: 0s; }
        .sakura span:nth-child(11n+2) { animation-delay: 9s; }
        .sakura span:nth-child(11n+3) { animation-delay: 2s; }
        .sakura span:nth-child(11n+4) { animation-delay: 5s; }
        .sakura span:nth-child(11n+5) { animation-delay: 6s; }
        .sakura span:nth-child(11n+6) { animation-delay: 7s; }
        .sakura span:nth-child(11n+7) { animation-delay: 3s; }
        .sakura span:nth-child(11n+8) { animation-delay: 1s; }
        .sakura span:nth-child(11n+9) { animation-delay: 2s; }
        .sakura span:nth-child(11n+10) { animation-delay: 11s; }
        .sakura span:nth-child(11n+11) { animation-delay: 10s; }
        @keyframes sakura-var { 0% { top: -10%; transform: translateX(0) rotateZ(var(--rz)) rotateX(0deg) rotateY(0deg); } 100% { top: 100%; transform: translateX(var(--drift)) rotateZ(var(--rz)) rotateX(var(--rx)) rotateY(var(--ry)); } }
        @media (prefers-reduced-motion: reduce) { .sakura span { animation: none !important; } }
        .sakura-tree { position: fixed; left: 0; bottom: 0; width: 180px; height: 220px; z-index: 0; pointer-events: none; }
        .sakura-tree .trunk { position: absolute; left: 30px; bottom: 0; width: 20px; height: 140px; background: #8d6e63; border-radius: 8px; }
        .sakura-tree .canopy { position: absolute; bottom: 80px; width: 120px; height: 120px; background: #f8bbd0; border-radius: 50%; opacity: 0.8; }
        .sakura-tree .canopy1 { left: 20px; }
        .sakura-tree .canopy2 { left: 0px; width: 90px; height: 90px; bottom: 110px; }
        .sakura-tree .canopy3 { left: 80px; width: 90px; height: 90px; bottom: 110px; }
        .bg-white { background-color: rgba(255,255,255,0.85) !important; }
        .bg-gray-50 { background-color: rgba(248, 250, 252, 0.7) !important; }
      `}</style>
    </div>
  )
}
