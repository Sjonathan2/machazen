import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Calendar from '../components/Calendar'
import { getStockStatusIcon } from '../lib/stockUtils'

export default function Dashboard() {
  const [stocks, setStocks] = useState([])
  const [lowStocks, setLowStocks] = useState([])
  
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showNotesWarning, setShowNotesWarning] = useState(false)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null)
  const [confirmDeleteNoteTitle, setConfirmDeleteNoteTitle] = useState('')
  const router = useRouter()
  const [ownerMostPopular, setOwnerMostPopular] = useState({ name:'-', qty:0, percent:0 })
  const [ownerNetProfit, setOwnerNetProfit] = useState({ amount:0, growth:0 })
  const [ownerTopCustomers, setOwnerTopCustomers] = useState([])
  const [ownerTotalSold, setOwnerTotalSold] = useState(0)

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

  function baseUnitLabel(u) {
    const nu = normalizeUnit(u)
    if (nu === 'kilogram' || nu === 'gram') return 'Gram'
    if (nu === 'liter' || nu === 'mililiter') return 'Mililiter'
    return 'Pieces'
  }

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
      } else {
        const data = await res.json()
        setUser(data.user)
        refreshNotes()
        refreshOwnerMetrics()
        fetch('/api/stocks')
          .then((r) => r.json())
          .then((data) => {
            setStocks(data)
            const low = data
              .filter((s) => {
                const nu = normalizeUnit(s.unit)
                const qBase = nu === 'kilogram' ? Number(s.quantity) * 1000 : (nu === 'liter' ? Number(s.quantity) * 1000 : Number(s.quantity))
                const minBase = Number(s.minLevel || 0)
                return qBase < minBase
              })
              .map((s) => {
                const unitLabel = labelFromUnit(normalizeUnit(s.unit))
                const nu = normalizeUnit(s.unit)
                const qBase = nu === 'kilogram' ? Number(s.quantity) * 1000 : (nu === 'liter' ? Number(s.quantity) * 1000 : Number(s.quantity))
                const shortage = Math.max(0, Number(s.minLevel || 0) - qBase)
                const baseLabel = baseUnitLabel(s.unit)
                return { ...s, unitLabel, baseLabel, status: 'Hampir Habis', shortage }
              })
            setLowStocks(low)
          })
      }
    }
    checkAuth()
  }, [])

  

  function refreshNotes() {
    fetch('/api/notes').then(r => r.json()).then((data)=>{
      const SYS_TITLES = ['FINANCE_TX','BUDGET','FORECAST','METRIC_TOTAL_PRODUCTS_SOLD','SETTINGS_LOG','FINANCE_LOG','PRODUCT_LOG']
      const filtered = (Array.isArray(data)?data:[])
        .filter(n => {
          const t = String(n.title||'')
          if (SYS_TITLES.includes(t)) return false
          if (/^[A-Z_]+_LOG$/.test(t)) return false
          return true
        })
      setNotes(filtered)
    })
  }

  async function addNote(e) {
    e.preventDefault()
    if (!title && !content) {
      setShowNotesWarning(true)
      return
    }
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    })
    setTitle('')
    setContent('')
    refreshNotes()
  }

  async function deleteNote(id) {
    await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    refreshNotes()
  }

  function openDeleteNoteConfirm(note) {
    setConfirmDeleteNoteId(note.id)
    setConfirmDeleteNoteTitle(note.title)
  }

  async function confirmDeleteNote() {
    if (!confirmDeleteNoteId) return
    await deleteNote(confirmDeleteNoteId)
    setConfirmDeleteNoteId(null)
    setConfirmDeleteNoteTitle('')
  }

  function cancelDeleteNote() {
    setConfirmDeleteNoteId(null)
    setConfirmDeleteNoteTitle('')
  }
  async function refreshOwnerMetrics(){
    try {
      const salesRes = await fetch('/api/sales')
      const salesData = salesRes.ok ? await salesRes.json() : []
      const orders = Array.isArray(salesData)?salesData:[]
      const today = new Date(); const y= today.getFullYear(); const m= today.getMonth(); const d= today.getDate()
      const start = new Date(y,m,d); const end = new Date(y,m,d,23,59,59,999)
      const itemsToday = orders
        .filter(o=>{ const t = new Date(o.createdAt); return t>=start && t<=end })
        .flatMap(o=>Array.isArray(o.items)?o.items:[])
      const itemsAll = orders.flatMap(o=>Array.isArray(o.items)?o.items:[])
      function computeTop(items){
        const byMenu = {}
        for(const it of items){
          const raw = String(it.name||'').trim()
          const key = raw.toLowerCase()
          if(!key) continue
          const prev = byMenu[key] || { label: raw, qty: 0 }
          byMenu[key] = { label: prev.label, qty: prev.qty + (Number(it.quantity)||0) }
        }
        let best = { label:'-', qty:0 }
        Object.values(byMenu).forEach(v=>{ if(v.qty>best.qty){ best=v } })
        const totalQty = items.reduce((sum,it)=>sum+(Number(it.quantity)||0),0)
        return { name: best.label, percent: totalQty>0 ? (best.qty*100/totalQty) : 0 }
      }
      let mp = computeTop(itemsToday)
      if (!mp.name || mp.name==='-') mp = computeTop(itemsAll)
      setOwnerMostPopular({ name: mp.name, qty: 0, percent: mp.percent })

      const custAgg = {}
      for(const o of orders){
        const raw = String(o.customerName||'-').trim()
        if(!raw || raw==='-') continue
        const key = raw.toLowerCase()
        const total = Number(o.total)||0
        const prev = custAgg[key] || { name: raw, count: 0, spent: 0 }
        custAgg[key] = { name: prev.name, count: prev.count + 1, spent: prev.spent + total }
      }
      const topCust = Object.values(custAgg).sort((a,b)=> (b.count - a.count) || (b.spent - a.spent)).slice(0,5)
      setOwnerTopCustomers(topCust)

      const fromToday = new Date(y,m,d).toISOString().slice(0,10)
      const toToday = new Date(y,m,d).toISOString().slice(0,10)
      const rToday = await fetch(`/api/finance/summary?from=${fromToday}&to=${toToday}`)
      const sToday = rToday.ok ? await rToday.json() : {}
      let sY = {}
      for(let i=1;i<=7;i++){
        const yd = new Date(y,m,d-i)
        const fromY = new Date(yd.getFullYear(), yd.getMonth(), yd.getDate()).toISOString().slice(0,10)
        const toY = fromY
        const rY = await fetch(`/api/finance/summary?from=${fromY}&to=${toY}`)
        if (rY.ok){ sY = await rY.json(); const val = Number(sY?.incomeStatement?.netProfit||0)||0; if (val!==0) break }
      }
      const netToday = Number(sToday?.incomeStatement?.netProfit||0)||0
      const netY = Number(sY?.incomeStatement?.netProfit||0)||0
      let growth = 0
      if (Math.abs(netY) > 0) growth = ((netToday - netY) / Math.abs(netY)) * 100
      setOwnerNetProfit({ amount: netToday, growth })

      const notesRes = await fetch('/api/notes')
      const notesData = notesRes.ok ? await notesRes.json() : []
      const metric = (Array.isArray(notesData)?notesData:[]).find(n=> String(n.title||'') === 'METRIC_TOTAL_PRODUCTS_SOLD')
      let metricVal = metric ? Number(metric.content||'0')||0 : 0
      if (!metricVal) metricVal = itemsAll.reduce((sum,it)=>sum+(Number(it.quantity)||0),0)
      setOwnerTotalSold(metricVal)
    } catch {}
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>

  const NAME_MAP = {
    'kent@machazen.id': 'Kent Susanto',
    'owner@machazen.id': 'Owner Machazen',
    'bukanalden@gmail.com': 'Joshua Alden',
    'jersy_istri@zhongli.com': 'Jersy Liora',
    'leenciaaa@gmail.com': 'Patricia Aileen',
    'lauren@machazen.id': 'Laurencia Aurelia Calysta',
    'employee@machazen.id': 'Employee Machazen',
  }
  const welcomeName = user?.email && NAME_MAP[user.email] ? NAME_MAP[user.email] : user?.email

  return (
    <Layout user={user}>
      <h1 className="text-4xl font-bold mb-2" style={{ color: '#2e7d32' }}>Dashboard</h1>
      <p className="text-gray-600 mb-6">Selamat datang, {welcomeName}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {user?.email === 'kent@machazen.id' && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg shadow gradient-background" style={{ borderTop: '4px solid #ffc3de' }}>
              <div className="font-bold mb-2">Menu Paling Populer</div>
              <div className="text-sm text-gray-700">{ownerMostPopular.name || '-'}</div>
              <div className="text-sm text-gray-500">Kontribusi {ownerMostPopular.percent.toFixed(2).replace('.', ',')}%</div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow gradient-background" style={{ borderTop: '4px solid #ffc3de' }}>
              <div className="font-bold mb-2">Laba Bersih</div>
              <div className="text-sm text-gray-700">Rp. {(Number(ownerNetProfit.amount)||0).toLocaleString('id-ID')}</div>
              <div className="text-sm text-gray-500">Perubahan {ownerNetProfit.growth.toFixed(2).replace('.', ',')}%</div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow gradient-background" style={{ borderTop: '4px solid #ffc3de' }}>
              <div className="font-bold mb-2">Top 5 Pembeli Loyal</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {ownerTopCustomers.map((c,idx)=>(
                  <li key={idx}><span className="font-semibold">{String(c.name||'-')}</span> — Rp. {(Number(c.spent)||0).toLocaleString('id-ID')} (× {c.count})</li>
                ))}
                {ownerTopCustomers.length===0 && (<li>-</li>)}
              </ul>
            </div>
            <div className="bg-white p-5 rounded-lg shadow gradient-background" style={{ borderTop: '4px solid #ffc3de' }}>
              <div className="font-bold mb-2">Total Produk Terjual</div>
              <div className="text-sm text-gray-700">{ownerTotalSold}</div>
              <div className="text-xs text-gray-500">Akumulasi tidak berkurang saat data lama terhapus</div>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-lg shadow" style={{ borderTop: '4px solid #2e7d32' }}>
          <h2 className="font-bold mb-4">Kalender</h2>
          <Calendar />
        </div>

        <div className="bg-white p-6 rounded-lg shadow" style={{ borderTop: '4px solid #ff9800' }}>
          <h2 className="font-bold mb-4">⚠️ Stok Kurang ({lowStocks.length})</h2>
          {lowStocks.length === 0 ? (
            <div className="text-green-600 font-semibold">✓ Semua stok aman</div>
          ) : (
            <ul className="space-y-2">
              {lowStocks.map((s) => (
                <li key={s.id} className="text-sm border-l-2 border-orange-400 pl-3 py-1">
                  <strong>{s.name}</strong> {s.quantity} {s.unitLabel} = {getStockStatusIcon('Hampir Habis')} Hampir Habis
                  <span className="text-xs ml-1">(Kurang {s.shortage} {s.baseLabel})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow md:col-span-2" style={{ borderTop: '4px solid #ffd54f' }}>
          <h2 className="font-bold mb-4">📌 Catatan</h2>
          <form onSubmit={addNote} className="mb-4">
            <label className="text-sm text-gray-600 mb-1 block">Judul catatan:</label>
            <input
              placeholder="Judul catatan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded mb-2"
            />
            <label className="text-sm text-gray-600 mb-1 block">Isi catatan:</label>
            <textarea
              placeholder="Isi catatan..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border p-2 rounded mb-3 h-24"
            />
            <button type="submit" className="px-4 py-2 rounded text-white flex items-center justify-center" style={{ background: '#2e7d32' }} aria-label="Tambah Catatan">
              <img src="/images/comment.svg" alt="Tambah Catatan" className="w-5 h-5" />
            </button>
          </form>

          <div className="space-y-3 max-h-64 overflow-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg shadow"
                style={{ background: '#fffde7', borderTop: '3px solid #fdd835' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{note.title}</h3>
                  <button onClick={() => openDeleteNoteConfirm(note)} className="text-red-500 hover:text-red-700" aria-label="Hapus Catatan">
                    <img src="/images/trash%20icon.svg" alt="Hapus" className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{note.content}</p>
                <div className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString('id-ID')}</div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="text-sm text-gray-500">Belum ada catatan.</div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .gradient-background { 
          background: linear-gradient(180deg,#ffc3de,#ffffff,#ffffff,#ffffff); 
          background-size: 240% 240%; 
          animation: gradient-animation 4s ease infinite; 
        }
        @keyframes gradient-animation { 
          0% { background-position: 0% 50%; } 
          50% { background-position: 100% 50%; } 
          100% { background-position: 0% 50%; } 
        }
      `}</style>
      {showNotesWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Peringatan</div>
            <div className="text-sm text-gray-700 mb-4">Area Pengisian Catatan Tidak Boleh Kosong</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNotesWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteNoteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus catatan <span className="font-semibold">{confirmDeleteNoteTitle}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteNote} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDeleteNote} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
