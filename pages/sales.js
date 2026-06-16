import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'

export default function SalesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])

  const [customerName, setCustomerName] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saleQty, setSaleQty] = useState('')
  const [saleItems, setSaleItems] = useState([])
  const [isPaid, setIsPaid] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersPage, setOrdersPage] = useState(1)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState(null)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [insufficientData, setInsufficientData] = useState([])
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState(null)
  const [confirmDeleteOrderCustomer, setConfirmDeleteOrderCustomer] = useState('')
  const [confirmDeleteSaleItemIdx, setConfirmDeleteSaleItemIdx] = useState(null)
  const [confirmDeleteSaleItemName, setConfirmDeleteSaleItemName] = useState('')
  const [showSalesWarning, setShowSalesWarning] = useState(false)
  const [salesWarningText, setSalesWarningText] = useState('')

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      const pres = await fetch('/api/products')
      if (pres.ok) {
        const pdata = await pres.json()
        setProducts(pdata)
      }
    }
    init()
  }, [])

  useEffect(() => {
    async function loadOrders() {
      const res = await fetch('/api/sales')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    }
    loadOrders()
  }, [])

  const selectedProduct = useMemo(() => products.find(p => String(p.id) === String(selectedProductId)), [products, selectedProductId])
  const filteredProducts = useMemo(() => {
    const q = String(productQuery).trim().toLowerCase()
    if (!q) return []
    return products.filter(p => String(p.name).toLowerCase().startsWith(q))
  }, [products, productQuery])
  const totalPayment = useMemo(() => saleItems.reduce((sum, it) => sum + ((Number(it.price) || 0) * Number(it.quantity || 0)), 0), [saleItems])

  function emailUsername(email) {
    if (!email) return '-'
    const s = String(email)
    const at = s.indexOf('@')
    return at > 0 ? s.slice(0, at) : s
  }

  async function markOrderPaid(orderId, method) {
    if (!orderId) return
    const r = await fetch(`/api/sales/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: true, paymentMethod: method }) })
    if (r.ok) {
      const up = await r.json()
      setOrders(prev => prev.map(x => x.id === orderId ? up : x))
    }
    setShowPaymentModal(false)
    setPaymentOrderId(null)
  }

  function downloadOrderReceipt(o) {
    const win = window.open('', 'PRINT', 'height=600,width=800')
    const now = new Date().toLocaleString('id-ID')
    const totalText = (Number(o.total) || 0).toLocaleString('id-ID')
    const rows = (o.items || []).map((item, i) => `
      <tr>
        <td style="padding:4px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.quantity}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.unit || '-'}</td>
      </tr>`).join('')
    win.document.write(`
      <html>
        <head>
          <title>Nota Pesanan - ${o.customerName || 'Tanpa Nama'}</title>
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
          <div>Customer: ${o.customerName || '-'}</div>
          <div class="status">Status: ${o.paid ? 'LUNAS' : 'BELUM LUNAS'}</div>
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
          <div style="margin-top:8px;font-weight:bold">Total Bayar: Rp ${totalText}</div>
          <p style="margin-top:16px">Terima kasih atas pembelian Anda.</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  function addSaleItem(e) {
    e.preventDefault()
    let chosen = selectedProduct
    if (!chosen && productQuery) {
      const exact = products.find(p => String(p.name).toLowerCase() === String(productQuery).trim().toLowerCase())
      if (exact) chosen = exact
    }
    if (!chosen || Number(saleQty) <= 0) {
      setSalesWarningText('Semua kolom harus diisi dan dipilih')
      setShowSalesWarning(true)
      return
    }
    setSaleItems(prev => ([...prev, { productId: chosen.id, name: chosen.name, unit: '-', price: Number(chosen.price) || 0, quantity: Number(saleQty) }]))
    setSelectedProductId('')
    setProductQuery('')
    setSaleQty('')
  }

  function removeSaleItem(index) {
    setSaleItems(prev => prev.filter((_, i) => i !== index))
  }

  function markPaid() {
    if (saleItems.length === 0) return
    if (confirm('Tandai transaksi ini sebagai SUDAH LUNAS?')) setIsPaid(true)
  }

  function resetSale() {
    setCustomerName('')
    setSaleItems([])
    setIsPaid(false)
  }

  async function createOrder() {
    if (saleItems.length === 0 || !customerName || String(customerName).trim() === '') {
      setSalesWarningText('Semua kolom harus diisi dan dipilih')
      setShowSalesWarning(true)
      return
    }
    const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, items: saleItems }) })
    if (res.ok) {
      const created = await res.json()
      setOrders(prev => [created, ...prev])
      setCustomerName('')
      setSaleItems([])
      setSelectedProductId('')
      setProductQuery('')
      setSaleQty('')
    } else {
      try {
        const err = await res.json()
        if (err && err.insufficient && Array.isArray(err.insufficient) && err.insufficient.length > 0) {
          setInsufficientData(err.insufficient)
          setShowInsufficientModal(true)
        } else {
          alert('Gagal membuat pesanan')
        }
      } catch {
        alert('Gagal membuat pesanan')
      }
    }
  }

  function downloadReceipt() {
    const win = window.open('', 'PRINT', 'height=600,width=800')
    const now = new Date().toLocaleString('id-ID')
    const totalText = (Number(totalPayment) || 0).toLocaleString('id-ID')
    const rows = saleItems.map((item, i) => `
      <tr>
        <td style="padding:4px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.name}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.quantity}</td>
        <td style="padding:4px;border:1px solid #ddd">${item.unit || '-'}</td>
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
          <div style="margin-top:8px;font-weight:bold">Total Bayar: Rp ${totalText}</div>
          <p style="margin-top:16px">Terima kasih atas pembelian Anda.</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Penjualan</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="font-bold mb-4">Transaksi Penjualan</h2>

        <div className="mb-4">
          <label className="block text-sm mb-1">Nama Customer</label>
          <input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} className="border p-2 rounded w-full" placeholder="Nama customer" />
        </div>

        <form onSubmit={addSaleItem} className="border rounded p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                value={productQuery}
                onChange={(e)=>{ const v = e.target.value; setProductQuery(v); setShowSuggestions(v.trim().length >= 1) }}
                onFocus={()=>setShowSuggestions(productQuery.trim().length >= 1)}
                onBlur={()=>setTimeout(()=>setShowSuggestions(false), 100)}
                className="border p-2 rounded w-full"
                placeholder="Pilih Produk"
              />
              {showSuggestions && productQuery.trim().length >= 1 && (
                <div className="absolute z-10 mt-1 w-full border rounded bg-white max-h-40 overflow-auto">
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onMouseDown={()=>{ setSelectedProductId(p.id); setProductQuery(p.name); setShowSuggestions(false) }}
                      className="px-2 py-1 cursor-pointer hover:bg-gray-100"
                    >
                      {p.name} {`(Rp ${((Number(p.price)||0).toLocaleString('id-ID'))})`}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-2 py-1 text-sm text-gray-600">Produk tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
            <input type="number" min="1" value={saleQty} onChange={(e)=>setSaleQty(e.target.value)} className="border p-2 rounded" placeholder="Qty" />
          </div>
          <div className="mt-3">
            <button type="submit" className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>Tambah Item</button>
          </div>
        </form>

        <div className="mb-4">
          <h3 className="font-semibold mb-2"></h3>
          {saleItems.length === 0 ? (
            <div className="text-sm text-gray-600"></div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ background: '#e8f5e9' }}>
                <tr>
                  <th className="p-2 text-left">Produk</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((it, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{it.name}</td>
                    <td className="p-2">{it.quantity}</td>
                    <td className="p-2"><button onClick={()=>{ setConfirmDeleteSaleItemIdx(idx); setConfirmDeleteSaleItemName(it.name || '-') }} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {saleItems.length > 0 && (
            <div className="mt-3 text-right font-semibold">Total Bayar: {`Rp ${totalPayment.toLocaleString('id-ID')}`}</div>
          )}
          <div className="mt-3">
            <button
              onClick={createOrder}
              disabled={saleItems.length === 0}
              className={`px-4 py-2 rounded text-white ${saleItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
              style={{ background: saleItems.length === 0 ? undefined : '#2e7d32' }}
            >
              Buat Daftar Pesanan
            </button>
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="font-bold mb-4">Daftar Pesanan</h2>
        {orders.length === 0 ? (
          <div className="text-sm text-gray-600">Belum ada pesanan.</div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(orders.length / 5))
              const currentPage = Math.min(ordersPage, totalPages)
              const start = (currentPage - 1) * 5
              const pageItems = orders.slice(start, start + 5)
              return pageItems.map((o) => (
                <div key={o.id} className="p-3 border-2 rounded" style={{ borderColor: o.paid ? '#2e7d32' : '#d32f2f' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{o.customerName} - {`Rp ${((Number(o.total) || 0).toLocaleString('en-US'))}`}</div>
                      <div className="text-xs text-gray-600">Pesanan Dibuat Oleh: {emailUsername(o.createdByEmail || user?.email)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!o.paid ? (
                        <button onClick={()=>{ setPaymentOrderId(o.id); setShowPaymentModal(true) }} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Lunas</button>
                      ) : (
                        <button onClick={async()=>{ const r = await fetch(`/api/sales/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: false }) }); if (r.ok) { const up = await r.json(); setOrders(prev=>prev.map(x=>x.id===o.id?up:x)) } }} className="px-3 py-1 bg-yellow-600 text-white rounded text-xs">Belum Lunas</button>
                      )}
                      <button onClick={()=>{ setConfirmDeleteOrderId(o.id); setConfirmDeleteOrderCustomer(o.customerName || '-') }} className="p-1 rounded" style={{ background: 'transparent' }} title="Hapus">
                        <img src="/images/trash%20icon.svg" alt="Hapus" width="18" height="18" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                   {o.items.map((it, i) => (
                     <div key={i}>- {it.name} ({it.quantity}x)</div>
                   ))}
                  </div>
                  <div className="mt-3" style={{ borderTop: `1px solid ${o.paid ? '#2e7d32' : '#d32f2f'}` }} />
                  <div className="pt-2 flex items-center gap-2">
                    <div className="text-sm font-semibold" style={{ color: o.paid ? '#2e7d32' : '#d32f2f' }}>{o.paid ? 'Lunas' : 'Belum Lunas'}</div>
                    {o.paid && (
                      <button onClick={()=>downloadOrderReceipt(o)} className="px-2 py-1 rounded text-xs text-white" style={{ background: '#2e7d32' }}>Nota</button>
                    )}
                  </div>
                </div>
              ))
            })()}
            {(() => {
              const totalPages = Math.max(1, Math.ceil(orders.length / 5))
              const currentPage = Math.min(ordersPage, totalPages)
              return (
                <div className="mt-3">
                  <Pagination current={currentPage} total={totalPages} onChange={(p) => setOrdersPage(p)} />
                </div>
              )
            })()}
          </div>
        )}
      </div>
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowPaymentModal(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-4">Pilih Metode Pembayaran</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>markOrderPaid(paymentOrderId, 'CASH')} className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>CASH</button>
              <button onClick={()=>markOrderPaid(paymentOrderId, 'QRIS')} className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>QRIS</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteSaleItemIdx !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>{ setConfirmDeleteSaleItemIdx(null); setConfirmDeleteSaleItemName('') }}>
          <div className="bg-white rounded-lg shadow p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus item <span className="font-semibold">{confirmDeleteSaleItemName}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{ setConfirmDeleteSaleItemIdx(null); setConfirmDeleteSaleItemName('') }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={()=>{ if(confirmDeleteSaleItemIdx!==null){ removeSaleItem(confirmDeleteSaleItemIdx) } setConfirmDeleteSaleItemIdx(null); setConfirmDeleteSaleItemName('') }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>{ setConfirmDeleteOrderId(null); setConfirmDeleteOrderCustomer('') }}>
          <div className="bg-white rounded-lg shadow p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus pesanan <span className="font-semibold">{confirmDeleteOrderCustomer}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{ setConfirmDeleteOrderId(null); setConfirmDeleteOrderCustomer('') }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={async()=>{ const r = await fetch(`/api/sales/${confirmDeleteOrderId}`, { method: 'DELETE' }); if (r.ok) { setOrders(prev=>prev.filter(x=>x.id!==confirmDeleteOrderId)) } setConfirmDeleteOrderId(null); setConfirmDeleteOrderCustomer('') }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {showInsufficientModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowInsufficientModal(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-[28rem]" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Bahan tidak cukup</div>
            <div className="space-y-3 max-h-80 overflow-auto text-sm">
              {(() => {
                const groups = {}
                insufficientData.forEach(x => { const k = x.productName || '-'; groups[k] = groups[k] || []; groups[k].push(x) })
                return Object.entries(groups).map(([prod, arr]) => (
                  <div key={prod} className="border rounded p-2">
                    <div className="font-semibold mb-1">Untuk membuat {prod}</div>
                    {arr.map((a, i) => (
                      <div key={i}>- {a.stockName} (tersedia {Number(a.available).toLocaleString('id-ID')} {a.unit}, perlu {Number(a.required).toLocaleString('id-ID')} {a.unit})</div>
                    ))}
                  </div>
                ))
              })()}
            </div>
            <div className="mt-4 text-right">
              <button onClick={()=>setShowInsufficientModal(false)} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>OK</button>
            </div>
          </div>
        </div>
      )}
      {showSalesWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowSalesWarning(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-96" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">Peringatan</div>
            <div className="text-sm text-gray-700 mb-4">{salesWarningText}</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowSalesWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
