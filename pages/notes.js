import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'

export default function TransaksiPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stocks, setStocks] = useState([])

  // Penjualan state
  const [customerName, setCustomerName] = useState('')
  const [selectedStockId, setSelectedStockId] = useState('')
  const [saleQty, setSaleQty] = useState(1)
  const [saleItems, setSaleItems] = useState([])
  const [isPaid, setIsPaid] = useState(false)

  // Pembelian state
  const [purchasePlace, setPurchasePlace] = useState('')
  const [purchasePlaceLocked, setPurchasePlaceLocked] = useState(false)
  const [purchaseName, setPurchaseName] = useState('')
  const [purchaseUnit, setPurchaseUnit] = useState('')
  const [purchaseNet, setPurchaseNet] = useState('')
  const [purchaseQty, setPurchaseQty] = useState('')
  const [purchasePriceText, setPurchasePriceText] = useState('')
  const [purchaseItems, setPurchaseItems] = useState([])
  const [purchaseStartedAt, setPurchaseStartedAt] = useState('')
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [purchaseOrdersPage, setPurchaseOrdersPage] = useState(1)
  const [showItemSuggestions, setShowItemSuggestions] = useState(false)
  const [confirmDeletePurchaseId, setConfirmDeletePurchaseId] = useState(null)
  const [confirmDeletePurchasePlace, setConfirmDeletePurchasePlace] = useState('')
  const [showPurchaseWarning, setShowPurchaseWarning] = useState(false)
  const [purchaseWarningText, setPurchaseWarningText] = useState('')
  const [confirmDeleteTempIndex, setConfirmDeleteTempIndex] = useState(null)

  useEffect(() => {
    async function checkAuthAndLoad() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
      } else {
        const data = await res.json()
        setUser(data.user)
        const sres = await fetch('/api/stocks')
        if (sres.ok) {
          const sdata = await sres.json()
          setStocks(sdata)
        }
      }
    }
    checkAuthAndLoad()
  }, [])

  const selectedStock = useMemo(() => stocks.find(s => String(s.id) === String(selectedStockId)), [stocks, selectedStockId])
  const filteredStocks = useMemo(() => {
    const q = String(purchaseName).trim().toLowerCase()
    if (!q) return []
    return stocks.filter(s => String(s.name).toLowerCase().startsWith(q))
  }, [stocks, purchaseName])

  function formatThousands(val) {
    const digits = String(val).replace(/\D/g, '')
    if (!digits) return ''
    const num = Number(digits)
    return num.toLocaleString('en-US')
  }

  function normalizeUnit(u) {
    const m = { gram: 'gram', kilogram: 'kilogram', mililiter: 'mililiter', liter: 'liter', pieces: 'pieces', Gram: 'gram', Kilogram: 'kilogram', Mililiter: 'mililiter', Liter: 'liter', Pieces: 'pieces' }
    return m[String(u || '').trim()] || ''
  }

  function unitLabel(u) {
    const m = { gram: 'Gram', kilogram: 'Kg', mililiter: 'Ml', liter: 'L', pieces: 'Pcs' }
    return m[u] || u
  }

  function toTarget(val, from, to) {
    const f = normalizeUnit(from)
    const t = normalizeUnit(to)
    if (f === t) return Number(val)
    if (f === 'gram' && t === 'kilogram') return Number(val) / 1000
    if (f === 'kilogram' && t === 'gram') return Number(val) * 1000
    if (f === 'mililiter' && t === 'liter') return Number(val) / 1000
    if (f === 'liter' && t === 'mililiter') return Number(val) * 1000
    return Number(val)
  }

  function decimalComma(n) {
    const s = String(n)
    return s.replace('.', ',')
  }

  function emailUsername(email) {
    if (!email) return '-'
    const s = String(email)
    const at = s.indexOf('@')
    return at > 0 ? s.slice(0, at) : s
  }
  function displayRowQtySaved(it) {
    const u = normalizeUnit(it.unit)
    if (u === 'pieces') return `${it.qtyItems} ${unitLabel(u)}`
    const total = Number(it.qtyItems) * Number(it.net)
    if (u === 'gram' || u === 'kilogram') {
      if (u === 'gram' && total < 1000) return `${total} Gram`
      const asKg = u === 'gram' ? total / 1000 : total
      return `${decimalComma(asKg)} Kg`
    }
    if (u === 'mililiter' || u === 'liter') {
      if (u === 'mililiter' && total < 1000) return `${total} Ml`
      const asL = u === 'mililiter' ? total / 1000 : total
      return `${decimalComma(asL)} L`
    }
    return `${total} ${unitLabel(u)}`
  }
  function displayDetailSaved(it) {
    const u = normalizeUnit(it.unit)
    if (u === 'pieces' && !it.net) return `1 produk = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))}`
    const wl = u === 'gram' ? 'Gram' : u === 'kilogram' ? 'Kilogram' : u === 'mililiter' ? 'Mililiter' : u === 'liter' ? 'Liter' : 'Pcs'
    const netStr = (u === 'kilogram' || u === 'liter') ? decimalComma(it.net) : String(it.net)
    return `1 ${it.name} = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))} & ${netStr} ${wl}`
  }

  function addSaleItem(e) {
    e.preventDefault()
    if (!selectedStock || Number(saleQty) <= 0) return
    setSaleItems(prev => [
      ...prev,
      { stockId: selectedStock.id, name: selectedStock.name, unit: selectedStock.unit, quantity: Number(saleQty) }
    ])
    setSelectedStockId('')
    setSaleQty(1)
  }

  function removeSaleItem(index) {
    setSaleItems(prev => prev.filter((_, i) => i !== index))
  }

  function markPaid() {
    if (saleItems.length === 0) return
    if (confirm('Tandai transaksi ini sebagai SUDAH LUNAS?')) {
      setIsPaid(true)
    }
  }

  function resetSale() {
    setCustomerName('')
    setSaleItems([])
    setIsPaid(false)
  }

  function downloadReceipt() {
    // Buat halaman cetak sederhana yang bisa disimpan sebagai PDF melalui dialog print
    const win = window.open('', 'PRINT', 'height=600,width=800')
    const now = new Date().toLocaleString('id-ID')
    const rows = saleItems.map((item, i) => `
      <tr>
        <td style="padding:4px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.quantity}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.unit}</td>
      </tr>`).join('')
    win.document.write(`
      <html>
        <head>
          <title>Bukti Pembayaran - ${customerName || 'Tanpa Nama'}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { margin-bottom: 4px; }
            .status { margin: 6px 0; font-weight: bold; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          <h1>MACHAZEN.ID</h1>
          <div>Tanggal: ${now}</div>
          <div>Customer: ${customerName || '-'}</div>
          <div class="status">Status: ${isPaid ? 'LUNAS' : 'BELUM LUNAS'}</div>
          <table>
            <thead>
              <tr>
                <th style="padding:4px;border:1px solid #ddd">No</th>
                <th style="padding:4px;border:1px solid #ddd">Produk</th>
                <th style="padding:4px;border:1px solid #ddd">Qty</th>
                <th style="padding:4px;border:1px solid #ddd">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p style="margin-top:16px">Terima kasih atas pembelian Anda.</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  function addPurchaseItem(e) {
    e.preventDefault()
    const nUnit = normalizeUnit(purchaseUnit)
    const missing = []
    if (!purchasePlace || String(purchasePlace).trim() === '') missing.push('Nama supermarket/toko')
    if (!purchaseName || String(purchaseName).trim() === '') missing.push('Nama bahan')
    if (!purchaseUnit || !nUnit) missing.push('Satuan')
    if (nUnit !== 'pieces' && (purchaseNet === '' || Number(purchaseNet) <= 0)) missing.push('Berat Bersih')
    if (purchaseQty === '' || Number(purchaseQty) <= 0) missing.push('Qty')
    const cleanPrice = purchasePriceText ? Number(String(purchasePriceText).replace(/,/g, '')) : 0
    if (cleanPrice <= 0) missing.push('Harga per item/total')
    if (missing.length > 0) {
      setPurchaseWarningText('Semua kolom harus diisi dan dipilih')
      setShowPurchaseWarning(true)
      return
    }
    const nameKey = String(purchaseName).trim().toLowerCase()
    const dup = (purchaseItems||[]).some(it => String(it.name).trim().toLowerCase() === nameKey)
    if (dup) {
      setPurchaseWarningText('Nama bahan tidak boleh sama dengan daftar pembelian yang ada')
      setShowPurchaseWarning(true)
      return
    }
    if (!purchaseStartedAt) setPurchaseStartedAt(new Date().toISOString())
    const chosenStock = stocks.find(s => String(s.name).toLowerCase() === String(purchaseName).trim().toLowerCase())
    if (chosenStock) {
      setPurchaseUnit(String(chosenStock.unit).charAt(0).toUpperCase() + String(chosenStock.unit).slice(1))
    }
    setPurchaseItems(prev => ([
      ...prev,
      {
        name: purchaseName,
        unit: nUnit || '-',
        qtyItems: Number(purchaseQty),
        net: Number(purchaseNet) || 0,
        pricePerItem: cleanPrice
      }
    ]))
    setPurchasePlaceLocked(true)
    setPurchaseName('')
    setPurchaseUnit('')
    setPurchaseNet('')
    setPurchaseQty('')
    setPurchasePriceText('')
  }

  async function addPurchaseToStock() {
    if (purchaseItems.length === 0) return
    
    try {
      // Tambahkan setiap item pembelian ke stock
      for (const item of purchaseItems) {
        // Konversi unit ke format lowercase yang digunakan di stock
        const normalizedUnit = item.unit.toLowerCase()
        const response = await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            unit: normalizedUnit,
            quantity: item.quantity,
            minLevel: 0 // Default min level
          })
        })
        
        if (!response.ok) {
          throw new Error(`Gagal menambahkan ${item.name} ke stock`)
        }
      }
      
      // Kosongkan daftar pembelian setelah berhasil
      setPurchaseItems([])
      setPurchaseStartedAt('')
      alert('Semua pembelian berhasil ditambahkan ke stock!')
      
      // Refresh data stock
      const sres = await fetch('/api/stocks')
      if (sres.ok) {
        const sdata = await sres.json()
        setStocks(sdata)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function finishPurchase() {
    if (purchaseItems.length === 0) return
    if (!purchasePlace || String(purchasePlace).trim() === '') {
      setPurchaseWarningText('Semua kolom harus diisi dan dipilih')
      setShowPurchaseWarning(true)
      return
    }
    const itemsForOrder = purchaseItems.map((it) => {
      const u = it.unit
      const qtyTotalBase = u === 'pieces' ? Number(it.qtyItems) : Number(it.qtyItems) * Number(it.net)
      let displayQty = ''
      if (u === 'pieces') {
        displayQty = `${it.qtyItems} Pcs`
      } else if (u === 'gram' || u === 'kilogram') {
        if (u === 'gram' && qtyTotalBase < 1000) {
          displayQty = `${qtyTotalBase} Gram`
        } else {
          const asKg = u === 'gram' ? qtyTotalBase / 1000 : qtyTotalBase
          displayQty = `${decimalComma(asKg)} Kg`
        }
      } else if (u === 'mililiter' || u === 'liter') {
        if (u === 'mililiter' && qtyTotalBase < 1000) {
          displayQty = `${qtyTotalBase} Ml`
        } else {
          const asL = u === 'mililiter' ? qtyTotalBase / 1000 : qtyTotalBase
          displayQty = `${decimalComma(asL)} L`
        }
      } else {
        displayQty = `${qtyTotalBase} ${unitLabel(u)}`
      }
      const totalPrice = (Number(it.pricePerItem) || 0) * (Number(it.qtyItems) || 0)
      let detail = ''
      if (u === 'pieces' && !it.net) {
        detail = `1 produk = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))}`
      } else {
        const wl = u === 'gram' ? 'Gram' : u === 'kilogram' ? 'Kilogram' : u === 'mililiter' ? 'Mililiter' : u === 'liter' ? 'Liter' : 'Pcs'
        const netStr = (u === 'kilogram' || u === 'liter') ? decimalComma(it.net) : String(it.net)
        detail = `1 ${it.name} = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))} & ${netStr} ${wl}`
      }
      return { name: it.name, displayQty, totalPrice, detail, unit: u, qtyItems: it.qtyItems, net: it.net, pricePerItem: it.pricePerItem }
    })

    const payload = { place: purchasePlace || '-', createdAt: purchaseStartedAt || new Date().toISOString(), items: itemsForOrder }
    try {
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const created = await res.json()
        setPurchaseOrders(prev => [created, ...prev])
      }
    } catch {}

    try {
      const allStocks = await fetch('/api/stocks').then(r=>r.json())
      const DEFAULT_MIN = { kilogram: 2, gram: 300, mililiter: 500, liter: 2, pieces: 3 }
      for (const it of purchaseItems) {
        const u = it.unit
        const qtyTotalBase = u === 'pieces' ? Number(it.qtyItems) : Number(it.qtyItems) * Number(it.net)
        const existing = allStocks.find(s => String(s.name).toLowerCase() === String(it.name).toLowerCase())
        if (existing) {
          const converted = toTarget(qtyTotalBase, u, existing.unit)
          let newQty = Number(existing.quantity) + Number(converted)
          let newUnit = existing.unit
          if (existing.unit === 'gram' && newQty >= 1000) {
            newUnit = 'kilogram'
            newQty = newQty / 1000
          }
          if (existing.unit === 'mililiter' && newQty >= 1000) {
            newUnit = 'liter'
            newQty = newQty / 1000
          }
          const newMin = DEFAULT_MIN[normalizeUnit(newUnit)] || 0
          await fetch('/api/stocks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existing.id, name: existing.name, unit: newUnit, quantity: newQty, minLevel: newMin })
          })
        } else {
          let newUnit = u
          let newQty = qtyTotalBase
          if (u === 'gram' && qtyTotalBase >= 1000) {
            newUnit = 'kilogram'
            newQty = qtyTotalBase / 1000
          }
          if (u === 'mililiter' && qtyTotalBase >= 1000) {
            newUnit = 'liter'
            newQty = qtyTotalBase / 1000
          }
          const minLevel = DEFAULT_MIN[normalizeUnit(newUnit)] || 0
          await fetch('/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: it.name, unit: newUnit, quantity: newQty, minLevel })
          })
        }
      }
      await fetch('/api/settings/min-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kg: 2, g: 300, ml: 500, L: 2, pcs: 3 })
      })
    } catch {}

    setPurchaseItems([])
    setPurchaseStartedAt('')
    setPurchasePlace('')
    setPurchasePlaceLocked(false)
  }

  useEffect(() => {
    try {
      const rawItems = localStorage.getItem('purchase_items')
      if (rawItems) {
        const parsed = JSON.parse(rawItems)
        if (Array.isArray(parsed)) setPurchaseItems(parsed)
      }
      const rawPlace = localStorage.getItem('purchase_place')
      if (rawPlace) setPurchasePlace(rawPlace)
      const rawStarted = localStorage.getItem('purchase_started_at')
      if (rawStarted) setPurchaseStartedAt(rawStarted)
      const rawPrice = localStorage.getItem('purchase_price_text')
      if (rawPrice) setPurchasePriceText(rawPrice)
    } catch {}
    ;(async ()=>{ const res = await fetch('/api/purchases'); if (res.ok) { const data = await res.json(); setPurchaseOrders(data) } })()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('purchase_items', JSON.stringify(purchaseItems))
      localStorage.setItem('purchase_place', purchasePlace)
      localStorage.setItem('purchase_started_at', purchaseStartedAt)
      localStorage.setItem('purchase_price_text', purchasePriceText)
    } catch {}
  }, [purchaseItems, purchasePlace, purchaseStartedAt, purchasePriceText])

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Pembelian</h1>

      <div className="grid grid-cols-1 gap-6">
        
        
        
        
        
        
        
        
        
        
        
        
        
        {/* Pembelian */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Transaksi Pembelian</h2>

          <form onSubmit={addPurchaseItem} className="bg-white rounded">
            <div className="grid grid-cols-2 gap-3">
              <input value={purchasePlace} onChange={(e)=>!purchasePlaceLocked && setPurchasePlace(e.target.value)} className={`border p-2 rounded col-span-2 ${purchasePlaceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Nama supermarket/toko" disabled={purchasePlaceLocked} />
              <div className="relative">
                <input value={purchaseName} onChange={(e)=>{ setPurchaseName(e.target.value); setShowItemSuggestions(e.target.value.trim().length >= 1) }} onFocus={()=>setShowItemSuggestions(purchaseName.trim().length >= 1)} onBlur={()=>setTimeout(()=>setShowItemSuggestions(false), 100)} className="border p-2 rounded w-full" placeholder="Nama bahan" />
                {showItemSuggestions && purchaseName.trim().length >= 1 && (
                  <div className="absolute z-10 mt-1 w-full border rounded bg-white max-h-40 overflow-auto">
                    {filteredStocks.map(s => (
                      <div key={s.id} onMouseDown={()=>{ setPurchaseName(s.name); setPurchaseUnit(String(s.unit).charAt(0).toUpperCase() + String(s.unit).slice(1)); setShowItemSuggestions(false) }} className="px-2 py-1 cursor-pointer hover:bg-gray-100">{s.name}</div>
                    ))}
                    {filteredStocks.length === 0 && (
                      <div className="px-2 py-1 text-sm text-gray-600">Tidak ada bahan</div>
                    )}
                  </div>
                )}
              </div>
              <select value={purchaseUnit} onChange={(e)=>setPurchaseUnit(e.target.value)} className="border p-2 rounded">
                <option value="">Pilih satuan</option>
                <option value="Gram">Gram</option>
                <option value="Kilogram">Kilogram</option>
                <option value="Mililiter">Mililiter</option>
                <option value="Liter">Liter</option>
                <option value="Pieces">Pieces</option>
              </select>
              <input type="number" step="0.01" value={purchaseNet} onChange={(e)=>setPurchaseNet(e.target.value)} className="border p-2 rounded" placeholder="Berat Bersih" />
              <input type="number" value={purchaseQty} onChange={(e)=>setPurchaseQty(e.target.value)} className="border p-2 rounded" placeholder="Qty" />
              <input type="text" value={purchasePriceText} onChange={(e)=>setPurchasePriceText(formatThousands(e.target.value))} className="border p-2 rounded" placeholder="Harga Per Item" />
            </div>
            <div className="mt-3">
              <button type="submit" className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }} title="Tambah">
                <img src="/images/add%20icon.svg" alt="Tambah" width="18" height="18" />
              </button>
            </div>
          </form>

          {(() => {
            function displayRowQty(it) {
              const u = it.unit
              if (u === 'pieces') return `${it.qtyItems} ${unitLabel(u)}`
              const total = Number(it.qtyItems) * Number(it.net)
              if (u === 'gram' || u === 'kilogram') {
                if (u === 'gram' && total < 1000) return `${total} Gram`
                const asKg = u === 'gram' ? total / 1000 : total
                return `${decimalComma(asKg)} Kg`
              }
              if (u === 'mililiter' || u === 'liter') {
                if (u === 'mililiter' && total < 1000) return `${total} Ml`
                const asL = u === 'mililiter' ? total / 1000 : total
                return `${decimalComma(asL)} L`
              }
              return `${total} ${unitLabel(u)}`
            }
            function displayDetail(it) {
              if (it.unit === 'pieces' && !it.net) return `1 produk = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))}`
              const wl = it.unit === 'gram' ? 'Gram' : it.unit === 'kilogram' ? 'Kilogram' : it.unit === 'mililiter' ? 'Mililiter' : it.unit === 'liter' ? 'Liter' : 'Pcs'
              const netStr = it.unit === 'kilogram' || it.unit === 'liter' ? decimalComma(it.net) : String(it.net)
              return `1 ${it.name} = Rp. ${((Number(it.pricePerItem)||0).toLocaleString('en-US'))} & ${netStr} ${wl}`
            }
            const totalSum = purchaseItems.reduce((sum, it) => sum + (Number(it.pricePerItem)||0) * (Number(it.qtyItems)||0), 0)
            return (
              <div className="mt-4">
                <h3 className="font-semibold mb-2"></h3>
                {purchaseItems.length === 0 ? (
                  <div className="text-sm text-gray-600">Belum ada pembelian.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: '#e8f5e9' }}>
                        <tr>
                          <th className="p-2 text-left">Nama</th>
                          <th className="p-2 text-left">Qty</th>
                          <th className="p-2 text-left">Harga</th>
                          <th className="p-2 text-left">Detail</th>
                          <th className="p-2 text-left">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseItems.map((it, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{it.name}</td>
                            <td className="p-2">{displayRowQty(it)}</td>
                            <td className="p-2">{`Rp. ${(((Number(it.pricePerItem)||0) * (Number(it.qtyItems)||0))).toLocaleString('en-US')}`}</td>
                            <td className="p-2">{displayDetail(it)}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <button onClick={()=>{ setPurchaseName(it.name); setPurchaseUnit(String(it.unit).charAt(0).toUpperCase()+String(it.unit).slice(1)); setPurchaseNet(String(it.net)); setPurchaseQty(String(it.qtyItems)); setPurchasePriceText(String((Number(it.pricePerItem)||0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')); setPurchaseItems(prev=>prev.filter((_,idx)=>idx!==i)) }} className="p-1 rounded" style={{ background:'transparent' }} title="Edit">
                                  <img src="/images/edit%20icon.svg" alt="Edit" width="18" height="18" />
                                </button>
                                <button onClick={()=>{ setConfirmDeleteTempIndex(i) }} className="p-1 rounded" style={{ background:'transparent' }} title="Delete">
                                  <img src="/images/trash%20icon.svg" alt="Hapus" width="18" height="18" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 flex justify-between">
                      <button onClick={finishPurchase} className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }} title="Selesai">
                        <img src="/images/checklist%20icon.svg" alt="Selesai" width="18" height="18" />
                      </button>
                      <div className="font-semibold">Total: {`Rp. ${totalSum.toLocaleString('en-US')}`}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="font-bold mb-4">Daftar Pembelian</h2>
          {purchaseOrders.length === 0 ? (
            <div className="text-sm text-gray-600">Belum ada pembelian.</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(purchaseOrders.length / 5))
                const currentPage = Math.min(purchaseOrdersPage, totalPages)
                const start = (currentPage - 1) * 5
                const pageItems = purchaseOrders.slice(start, start + 5)
                return pageItems.map((o, idx) => (
                <div key={o.id || idx} className="p-3 border rounded">
                  <div className="font-semibold">{`Pembelian - ${(() => { const d = o.createdAt ? new Date(o.createdAt) : new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); const hh = String(d.getHours()).padStart(2,'0'); const min = String(d.getMinutes()).padStart(2,'0'); return `${dd}/${mm}/${yyyy} - ${hh}:${min}` })()}`}</div>
                  <div className="text-sm flex justify-between items-center">
                    <span>Tempat: {o.place || '-'}</span>
                    <button onClick={()=>{ if(!o.id) return; setConfirmDeletePurchaseId(o.id); setConfirmDeletePurchasePlace(o.place || '-') }} className="p-1 rounded" style={{ background:'transparent' }} title="Hapus Pembelian">
                      <img src="/images/trash%20icon.svg" alt="Hapus Pembelian" width="18" height="18" />
                    </button>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: '#e8f5e9' }}>
                        <tr>
                          <th className="p-2 text-left">Nama</th>
                          <th className="p-2 text-left">Qty</th>
                          <th className="p-2 text-left">Harga</th>
                          <th className="p-2 text-left">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((it, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{it.name}</td>
                            <td className="p-2">{displayRowQtySaved(it)}</td>
                            <td className="p-2">{`Rp. ${it.totalPrice.toLocaleString('en-US')}`}</td>
                            <td className="p-2">{displayDetailSaved(it)}</td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-sm">Pembelian Dilakukan Oleh: {emailUsername(o.createdByEmail || user?.email)}</div>
                </div>
              ))
              })()}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(purchaseOrders.length / 5))
                const currentPage = Math.min(purchaseOrdersPage, totalPages)
                return (
                  <div className="mt-3">
                    <Pagination current={currentPage} total={totalPages} onChange={(p) => setPurchaseOrdersPage(p)} />
                  </div>
                )
              })()}
            </div>
          )}
        </div>
        {showPurchaseWarning && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
              <div className="font-bold text-lg mb-2">Peringatan</div>
              <div className="text-sm text-gray-700 mb-4">{purchaseWarningText}</div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>setShowPurchaseWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
              </div>
            </div>
          </div>
        )}
        {confirmDeleteTempIndex !== null && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
              <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
              <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus item pembelian ini?</div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>setConfirmDeleteTempIndex(null)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
                <button onClick={()=>{ setPurchaseItems(prev=>prev.filter((_,idx)=>idx!==confirmDeleteTempIndex)); setConfirmDeleteTempIndex(null) }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
              </div>
            </div>
          </div>
        )}
        {confirmDeletePurchaseId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
              <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
              <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus pembelian di <span className="font-semibold">{confirmDeletePurchasePlace}</span>?</div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>{ setConfirmDeletePurchaseId(null); setConfirmDeletePurchasePlace('') }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
                <button onClick={async()=>{ const r = await fetch('/api/purchases', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: confirmDeletePurchaseId }) }); if (r.ok) { setPurchaseOrders(prev=>prev.filter(p=>p.id!==confirmDeletePurchaseId)) } setConfirmDeletePurchaseId(null); setConfirmDeletePurchasePlace('') }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
