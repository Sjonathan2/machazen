import Layout from '../components/Layout'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { withAuth } from '../lib/withAuth'

function Settings({ user }) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState([])
  const [minEdits, setMinEdits] = useState({})
  const prevUnitsRef = useRef({})
  const [dark, setDark] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [language, setLanguage] = useState('id')
  const T = {
    id: { title: 'Pengaturan', appearance: '', theme: 'Tema', langLabel: 'Bahasa', saveAria: 'Simpan Pengaturan' },
    en: { title: 'Settings', appearance: '', theme: 'Theme', langLabel: 'Language', saveAria: 'Save Settings' }
  }

  const UNIT_OPTIONS = [
    { value: 'kilogram', label: 'Kilogram' },
    { value: 'liter', label: 'Liter' },
    { value: 'mililiter', label: 'Mililiter' },
    { value: 'pieces', label: 'Pieces' },
    { value: 'gram', label: 'Gram' },
  ]

  function normalizeUnit(u) {
    if (!u) return 'gram'
    const map = { ml: 'mililiter', g: 'gram' }
    const nu = map[String(u).toLowerCase()] || String(u).toLowerCase()
    const allowed = UNIT_OPTIONS.map(o => o.value)
    return allowed.includes(nu) ? nu : 'gram'
  }

  function labelFromUnit(u) {
    const opt = UNIT_OPTIONS.find(o => o.value === u)
    return opt ? opt.label : u
  }

  function displayQtyUnit(s) {
    const nu = normalizeUnit(s.unit)
    const q = Number(s.quantity) || 0
    if (nu === 'gram') {
      if (q >= 1000) return { qty: (q / 1000).toString().replace('.', ','), unit: 'Kilogram' }
      return { qty: q, unit: 'Gram' }
    }
    if (nu === 'kilogram') {
      return { qty: q.toString().replace('.', ','), unit: 'Kilogram' }
    }
    if (nu === 'mililiter') {
      if (q >= 1000) return { qty: (q / 1000).toString().replace('.', ','), unit: 'Liter' }
      return { qty: q, unit: 'Mililiter' }
    }
    if (nu === 'liter') {
      return { qty: q.toString().replace('.', ','), unit: 'Liter' }
    }
    return { qty: q, unit: 'Pieces' }
  }

  function defaultMinForUnit(u) {
    const nu = normalizeUnit(u)
    const map = { kilogram: 2, gram: 300, liter: 2, mililiter: 500, pieces: 3 }
    return map[nu] ?? 0
  }

  useEffect(() => {
    setIsClient(true)
    loadStocks()
    try {
      const savedTheme = localStorage.getItem('theme')
      const isDark = savedTheme === 'dark'
      setDark(isDark)
      if (isDark) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
    } catch {}
    try { const lang = localStorage.getItem('lang') || 'id'; setLanguage(lang) } catch {}
  }, [])

  async function loadStocks() {
    try {
      const res = await fetch('/api/stocks')
      if (res.ok) {
        const data = await res.json()
        setStocks(data)
        const edits = {}
        data.forEach(s => { edits[s.id] = defaultMinForUnit(s.unit) })
        setMinEdits(edits)
        prevUnitsRef.current = Object.fromEntries(data.map(s => [s.id, normalizeUnit(s.unit)]))
      }
    } catch (err) {
      console.error('Error loading stocks:', err)
    }
  }

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const edits = {}
      stocks.forEach(s => { edits[s.id] = defaultMinForUnit(s.unit) })
      setMinEdits(edits)
    }
  }, [stocks])

  useEffect(() => {
    if (!stocks || stocks.length === 0) return
    const changed = stocks.filter(s => {
      const prev = prevUnitsRef.current[s.id]
      const curr = normalizeUnit(s.unit)
      return prev && prev !== curr
    })
    if (changed.length === 0) return
    ;(async () => {
      for (const s of changed) {
        const body = { id: s.id, name: s.name, unit: s.unit, quantity: s.quantity, minLevel: defaultMinForUnit(s.unit) }
        await fetch('/api/stocks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      prevUnitsRef.current = Object.fromEntries(stocks.map(s => [s.id, normalizeUnit(s.unit)]))
      await loadStocks()
    })()
  }, [stocks])

  function updateMinEdit(id, value) {
    const num = Number(value)
    setMinEdits(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      const changes = stocks.filter(s => (minEdits[s.id] ?? s.minLevel) !== s.minLevel)
      for (const s of changes) {
        const body = { id: s.id, name: s.name, unit: s.unit, quantity: s.quantity, minLevel: Number(minEdits[s.id] ?? s.minLevel) }
        const resp = await fetch('/api/stocks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!resp.ok) {
          alert(`Gagal menyimpan nilai minimum untuk ${s.name}`)
          break
        }
      }
      await loadStocks()
      try { await fetch('/api/settings/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Perubahan pengaturan: nilai minimum disimpan untuk ${changes.length} item.` }) }) } catch {}
      alert('Pengaturan berhasil disimpan!')
    } catch (error) {
      console.error('Error saving min levels:', error)
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setLoading(false)
    }
  }

  function toggleDark() {
    setDark(prev => {
      const next = !prev
      try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
      if (next) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      try { fetch('/api/settings/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Mengubah tema ke ${next ? 'Gelap' : 'Terang'}.` }) }) } catch {}
      return next
    })
  }

  function chooseLanguage(lang) {
    setLanguage(lang)
    try { localStorage.setItem('lang', lang) } catch {}
    setShowLangModal(false)
    try { fetch('/api/settings/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Mengubah bahasa ke ${lang === 'id' ? 'Indonesia' : 'English'}.` }) }) } catch {}
  }

  return (
    <Layout user={user}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pengaturan</h1>

        {/* Card: Nilai Minimum Stock per Item */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              <span className="mr-2">📦</span>
              Nilai Minimum Stock per Item
            </h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Daftar Stock
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Atur nilai minimum untuk setiap item stock agar status di Dashboard dan Daftar Stock sesuai.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#e8f5e9' }}>
                  <tr>
                    <th className="p-2 text-left">Nama</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Nilai Minimum</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    return stocks.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{s.name}</td>
                        {(() => { const d = displayQtyUnit(s); return (<><td className="p-2">{d.qty}</td><td className="p-2">{d.unit}</td></>) })()}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={minEdits[s.id] ?? defaultMinForUnit(s.unit)}
                            onChange={(e) => updateMinEdit(s.id, e.target.value)}
                            className="border p-1 rounded w-28"
                          />
                        </td>
                      </tr>
                    ))
                  })()}
                  {stocks.length === 0 && (
                    <tr>
                      <td className="p-2 text-gray-500" colSpan={4}>Tidak ada data stock.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-[#2e7d32] text-white px-3 py-2 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={T[language].saveAria}
            >
              <img src="/images/save%20icon.svg" alt="Simpan" width="18" height="18" />
            </button>
          </div>

        </div>

        

        {showLangModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowLangModal(false)}>
            <div className="bg-white rounded-lg shadow p-6 w-80" onClick={(e)=>e.stopPropagation()}>
              <div className="font-bold text-lg mb-3">Pilih Bahasa</div>
              <div className="space-y-2">
                <button onClick={()=>chooseLanguage('id')} className="w-full px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Bahasa Indonesia</button>
                <button onClick={()=>chooseLanguage('en')} className="w-full px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }}>English</button>
              </div>
            </div>
          </div>
        )}
        {showThemeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowThemeModal(false)}>
            <div className="bg-white rounded-lg shadow p-6 w-80" onClick={(e)=>e.stopPropagation()}>
              <div className="font-bold text-lg mb-3">{language==='en'?'Choose Theme':'Pilih Tema'}</div>
              <div className="space-y-2">
                <button onClick={()=>{ if (dark){ toggleDark() } setShowThemeModal(false) }} className="w-full px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }}>{language==='en'?'Light':'Terang'}</button>
                <button onClick={()=>{ if (!dark){ toggleDark() } setShowThemeModal(false) }} className="w-full px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }}>{language==='en'?'Dark':'Gelap'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        /* Toggle CSS from user */
        .checkbox { display: none; }
        .slider { width: 44px; height: 24px; background-color: lightgray; border-radius: 16px; overflow: hidden; display: flex; align-items: center; border: 3px solid transparent; transition: .3s; box-shadow: 0 0 10px 0 rgb(0, 0, 0, 0.25) inset; cursor: pointer; }
        .slider::before { content: ''; display: block; width: 100%; height: 100%; background-color: #fff; transform: translateX(-22px); border-radius: 16px; transition: .3s; box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25); }
        .checkbox:checked ~ .slider::before { transform: translateX(22px); box-shadow: 0 0 10px 3px rgb(0, 0, 0, 0.25); }
        .checkbox:checked ~ .slider { background-color: #2196F3; }
        .checkbox:active ~ .slider::before { transform: translate(0); }
      `}</style>
      <style jsx global>{`
        [data-theme='dark'] body { background:#121212; color:#e0e0e0; }
        [data-theme='dark'] .bg-white { background-color:#1e1e1e !important; }
        [data-theme='dark'] .text-gray-800 { color:#e0e0e0 !important; }
        [data-theme='dark'] .text-gray-700 { color:#cfcfcf !important; }
        [data-theme='dark'] .bg-gray-50 { background-color:#222 !important; }
        [data-theme='dark'] table thead { background:#2a2a2a !important; }
        /* Color adjustments */
        [data-theme='dark'] .text-green-700 { color:#1b5e20 !important; }
        [data-theme='dark'] .text-blue-700 { color:#0d47a1 !important; }
        [data-theme='dark'] .text-red-500, [data-theme='dark'] .text-red-600, [data-theme='dark'] .text-red-700 { color:#b71c1c !important; }
        [data-theme='dark'] .text-black { color:#8e6b7a !important; }
      `}</style>
    </Layout>
  )
}

export default withAuth(Settings)
