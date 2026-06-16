import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { getStockStatusColor, getStockStatusIcon } from '../lib/stockUtils'

export default function StockPage() {
  const [stocks, setStocks] = useState([])
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('gram')
  const [qty, setQty] = useState('')
  const [minLevel, setMinLevel] = useState(0)
  const [editId, setEditId] = useState(null)
  const [logs, setLogs] = useState([])
  const [user, setUser] = useState(null)
  const [stockStatuses, setStockStatuses] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteName, setConfirmDeleteName] = useState('')
  const [logsPage, setLogsPage] = useState(1)
  const [showNameWarning, setShowNameWarning] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
      } else {
        const data = await res.json()
        setUser(data.user)
        refresh()
      }
    }
    checkAuth()
  }, [])

  function refresh() {
    fetch('/api/stocks').then((r) => r.json()).then((data) => {
      setStocks(data)
      const statuses = {}
      data.forEach((stock) => {
        const nu = normalizeUnit(stock.unit)
        const qBase = nu === 'kilogram' ? Number(stock.quantity) * 1000 : (nu === 'liter' ? Number(stock.quantity) * 1000 : Number(stock.quantity))
        const minBase = Number(stock.minLevel) || 0
        const status = qBase <= 0 ? 'Habis' : (qBase < minBase ? 'Hampir Habis' : 'Tersedia')
        statuses[stock.id] = status
      })
      setStockStatuses(statuses)
    })
    fetch('/api/stocks/logs').then((r) => r.json()).then(setLogs)
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
    const nu = map[u.toLowerCase()] || u.toLowerCase()
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

  function toBaseQuantity(q, u) {
    const nu = normalizeUnit(u)
    if (nu === 'kilogram') return Number(q) * 1000
    if (nu === 'liter') return Number(q) * 1000
    return Number(q)
  }

  

  async function add(e) {
    e.preventDefault()
    if (!editId) return
    if (!name || String(name).trim() === '') {
      setShowNameWarning(true)
      return
    }
    const method = 'PUT'
    let finalQty = Number(qty) || 0;
    let finalUnit = unit;
    if (finalUnit === 'gram' && finalQty >= 1000) {
      finalUnit = 'kilogram';
      finalQty = finalQty / 1000;
    } else if (finalUnit === 'mililiter' && finalQty >= 1000) {
      finalUnit = 'liter';
      finalQty = finalQty / 1000;
    }
    const body = { id: editId, name, unit: finalUnit, quantity: finalQty, minLevel: Number(minLevel) || 0 }
    const res = await fetch('/api/stocks', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) return
    setQty('')
    setEditId(null)
    refresh()
  }

  function edit(stock) {
    let editedQty = stock.quantity;
    let editedUnit = normalizeUnit(stock.unit);
    if (editedUnit === 'kilogram') {
      editedQty *= 1000;
      editedUnit = 'gram';
    } else if (editedUnit === 'liter') {
      editedQty *= 1000;
      editedUnit = 'mililiter';
    }
    setEditId(stock.id)
    setName(stock.name)
    setUnit(editedUnit)
    setQty(editedQty === 0 ? '' : editedQty)
    setMinLevel(stock.minLevel)
  }

  async function del(id) {
    await fetch('/api/stocks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    refresh()
  }

  function openDeleteConfirm(stock) {
    setConfirmDeleteId(stock.id)
    setConfirmDeleteName(stock.name)
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    await del(confirmDeleteId)
    setConfirmDeleteId(null)
    setConfirmDeleteName('')
  }

  function cancelDelete() {
    setConfirmDeleteId(null)
    setConfirmDeleteName('')
  }

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Manajemen Stock</h1>

      <form onSubmit={add} className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-bold mb-4">Edit Stock</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nama Stock:</label>
            <input 
              placeholder="Nama Stock" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="border p-2 rounded w-full" 
              disabled={!editId} 
              style={{ background: !editId ? '#e5e7eb' : undefined }}
            />
          </div>          <div>
            <label className="text-sm text-gray-600 mb-1 block">Jumlah:</label>
            <input placeholder="Jumlah" type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="border p-2 rounded w-full" disabled={!editId} style={{ background: !editId ? '#e5e7eb' : undefined }} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {editId && (
            <button type="submit" className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>
              Update
            </button>
          )}
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setName(''); setUnit('gram'); setQty('') }} className="px-4 py-2 rounded bg-gray-400 text-white">
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Daftar Stock</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#e8f5e9' }}>
                <tr>
                  <th className="p-2 text-left">Nama</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Unit</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  return stocks.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{s.name}</td>
                      {(() => { const d = displayQtyUnit(s); return (<><td className="p-2">{d.qty}</td><td className="p-2">{d.unit}</td></>) })()}
                      <td className="p-2">
                        {stockStatuses[s.id] ? (
                          <span className={`${getStockStatusColor(stockStatuses[s.id])} font-medium`}>
                            {getStockStatusIcon(stockStatuses[s.id])} {stockStatuses[s.id]}
                            {stockStatuses[s.id] === 'Hampir Habis' && (
                              <span className="text-xs ml-1">
                                (Kurang {Math.max(0, (Number(s.minLevel || 0) - (normalizeUnit(s.unit) === 'kilogram' ? Number(s.quantity) * 1000 : (normalizeUnit(s.unit) === 'liter' ? Number(s.quantity) * 1000 : Number(s.quantity)))))} {normalizeUnit(s.unit) === 'kilogram' || normalizeUnit(s.unit) === 'gram' ? 'Gram' : (normalizeUnit(s.unit) === 'liter' || normalizeUnit(s.unit) === 'mililiter' ? 'Mililiter' : 'Pieces')})
                              </span>
                            )}
                            {stockStatuses[s.id] === 'Tersedia' && ((normalizeUnit(s.unit) === 'kilogram' ? Number(s.quantity) * 1000 : (normalizeUnit(s.unit) === 'liter' ? Number(s.quantity) * 1000 : Number(s.quantity))) === Number(s.minLevel || 0)) && (
                              <span className="text-xs ml-1 text-green-500">
                                (Pas)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">Loading...</span>
                        )}
                      </td>
                      <td className="p-2 flex gap-2" style={{ minWidth: '96px' }}>
                        <button onClick={() => edit(s)} className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" aria-label="Edit">
                          <img src="/images/edit%20icon.svg" alt="Edit" className="w-6 h-6" />
                        </button>
                        <button onClick={() => openDeleteConfirm(s)} className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" aria-label="Hapus">
                          <img src="/images/trash%20icon.svg" alt="Hapus" className="w-6 h-6" />
                        </button>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>

        
      </div>
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus stok <span className="font-semibold">{confirmDeleteName}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDelete} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {showNameWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Peringatan</div>
            <div className="text-sm text-gray-700 mb-4">Nama Stock Tidak Boleh Kosong</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNameWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
