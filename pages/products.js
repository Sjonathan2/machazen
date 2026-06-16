import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stocks, setStocks] = useState([])

  // Form Produk
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [ingredients, setIngredients] = useState([])

  // Ingredient editor
  const [selectedStockId, setSelectedStockId] = useState('')
  const [ingredientQty, setIngredientQty] = useState('')
  const [ingredientUnit, setIngredientUnit] = useState('')

  // Daftar produk tersimpan (local)
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState(null)
  const [confirmDeleteProductName, setConfirmDeleteProductName] = useState('')
  const [confirmDeleteIngredientIdx, setConfirmDeleteIngredientIdx] = useState(null)
  const [confirmDeleteIngredientName, setConfirmDeleteIngredientName] = useState('')
  const [productsPage, setProductsPage] = useState(1)
  const [showProductWarning, setShowProductWarning] = useState(false)
  const [productWarningText, setProductWarningText] = useState('')

  const UNIT_OPTIONS = [
    { value: 'gram', label: 'Gram' },
    { value: 'kilogram', label: 'Kilogram' },
    { value: 'mililiter', label: 'Mililiter' },
    { value: 'liter', label: 'Liter' },
    { value: 'pieces', label: 'Pieces' },
  ]

  function normalizeUnit(u) {
    if (!u) return 'gram'
    const map = { ml: 'mililiter', g: 'gram' }
    const nu = (String(u).toLowerCase())
    const mapped = map[nu] || nu
    const allowed = UNIT_OPTIONS.map(o => o.value)
    return allowed.includes(mapped) ? mapped : 'gram'
  }

  function labelFromUnit(u) {
    const opt = UNIT_OPTIONS.find(o => o.value === u)
    return opt ? opt.label : u
  }

  function toStockUnitQty(qty, inputU, stockU) {
    const iu = normalizeUnit(inputU)
    const su = normalizeUnit(stockU)
    if (iu === su) return Number(qty)
    if (su === 'gram' && iu === 'kilogram') return Number(qty) * 1000
    if (su === 'kilogram' && iu === 'gram') return Number(qty) / 1000
    if (su === 'mililiter' && iu === 'liter') return Number(qty) * 1000
    if (su === 'liter' && iu === 'mililiter') return Number(qty) / 1000
    return Number(qty)
  }

  function allowedUnitsForStock(stock) {
    const su = normalizeUnit(stock?.unit)
    if (su === 'gram' || su === 'kilogram') return ['gram', 'kilogram']
    if (su === 'mililiter' || su === 'liter') return ['mililiter', 'liter']
    return ['pieces']
  }

  function formatThousands(val) {
    const digits = String(val).replace(/\D/g, '')
    if (!digits) return ''
    const num = Number(digits)
    return num.toLocaleString('en-US')
  }

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      const sres = await fetch('/api/stocks')
      if (sres.ok) {
        const sdata = await sres.json()
        setStocks(sdata)
      }
      // load from API
      const pres = await fetch('/api/products')
      if (pres.ok) {
        const pdata = await pres.json()
        setProducts(pdata)
      }
    }
    init()
  }, [])

  async function refreshProducts() {
    const pres = await fetch('/api/products')
    if (pres.ok) {
      const pdata = await pres.json()
      setProducts(pdata)
    }
  }

  const selectedStock = useMemo(() => stocks.find(s => String(s.id) === String(selectedStockId)), [stocks, selectedStockId])

  useEffect(() => {
    if (selectedStock) {
      const su = normalizeUnit(selectedStock.unit)
      setIngredientUnit(su)
    } else {
      setIngredientUnit('')
    }
  }, [selectedStock])

  function addIngredient(e) {
    e.preventDefault()
    if (!selectedStock || Number(ingredientQty) <= 0) {
      setProductWarningText('Semua kolom harus diisi dan dipilih')
      setShowProductWarning(true)
      return
    }
    setIngredients(prev => ([...prev, { stockId: selectedStock.id, name: selectedStock.name, unit: selectedStock.unit, qty: Number(ingredientQty), inputUnit: ingredientUnit || normalizeUnit(selectedStock.unit) }]))
    setSelectedStockId('')
    setIngredientQty('')
    setIngredientUnit('')
  }

  function removeIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function updateIngredientQty(idx, qty) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, qty: Number(qty) } : ing))
  }

  function updateIngredientUnit(idx, unit) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, inputUnit: unit } : ing))
  }

  async function saveProduct() {
    if (!productName || String(productName).trim() === '') {
      setProductWarningText('Semua kolom harus diisi dan dipilih')
      setShowProductWarning(true)
      return
    }
    const cleanPrice = productPrice ? Number(String(productPrice).replace(/,/g, '')) : 0
    if (cleanPrice <= 0 || ingredients.length === 0 || ingredients.some(ing => !ing.stockId || Number(ing.qty) <= 0 || !(ing.inputUnit || normalizeUnit(ing.unit)))) {
      setProductWarningText('Semua kolom harus diisi dan dipilih')
      setShowProductWarning(true)
      return
    }
    const ingredientsPayload = ingredients.map((ing) => {
      const chosenUnit = ing.inputUnit || normalizeUnit(ing.unit)
      return { stockId: ing.stockId, name: ing.name, unit: chosenUnit, qty: Number(ing.qty) }
    })
    const payload = { name: productName, price: cleanPrice, ingredients: ingredientsPayload }
    let ok = false
    if (editingId) {
      const res = await fetch(`/api/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      ok = res.ok
      if (res.ok) { try { await fetch('/api/products/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Mengubah Produk: ${productName} • Rp. ${(cleanPrice||0).toLocaleString('en-US')}` }) }) } catch {} }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      ok = res.ok
      if (res.ok) { try { await fetch('/api/products/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Menambahkan Produk: ${productName} • Rp. ${(cleanPrice||0).toLocaleString('en-US')}` }) }) } catch {} }
    }
    if (!ok) return alert('Gagal menyimpan produk')
    // reset form & refresh list
    setProductName('')
    setProductPrice('')
    setIngredients([])
    setEditingId(null)
    await refreshProducts()
  }

  async function deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    try { await fetch('/api/products/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Menghapus Produk #${id}` }) }) } catch {}
    await refreshProducts()
  }

  async function confirmDelete() {
    if (!confirmDeleteProductId) return
    await deleteProduct(confirmDeleteProductId)
    setConfirmDeleteProductId(null)
    setConfirmDeleteProductName('')
  }

  function cancelDelete() {
    setConfirmDeleteProductId(null)
    setConfirmDeleteProductName('')
  }

  function openDeleteIngredient(idx, name){
    setConfirmDeleteIngredientIdx(idx)
    setConfirmDeleteIngredientName(name || '-')
  }

  function cancelDeleteIngredient(){
    setConfirmDeleteIngredientIdx(null)
    setConfirmDeleteIngredientName('')
  }

  function confirmDeleteIngredient(){
    if (confirmDeleteIngredientIdx === null) return
    removeIngredient(confirmDeleteIngredientIdx)
    setConfirmDeleteIngredientIdx(null)
    setConfirmDeleteIngredientName('')
  }

  function startEditProduct(p) {
    // load ke form agar bisa diubah-ubah
    setProductName(p.name)
    setProductPrice((Number(p.price) || 0).toLocaleString('en-US'))
    setIngredients(p.ingredients.map(ing => ({ ...ing, inputUnit: normalizeUnit(ing.unit) })))
    setEditingId(p.id)
  }

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Manajemen Produk</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Produk */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Form Produk</h2>

          <div className="mb-3">
            <label className="block text-sm mb-1">Nama Produk</label>
            <input value={productName} onChange={(e)=>setProductName(e.target.value)} className="border p-2 rounded w-full" placeholder="Contoh: Matcha Latte" />
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Harga per 1 Produk</label>
            <input type="text" value={productPrice} onChange={(e)=>setProductPrice(formatThousands(e.target.value))} className="border p-2 rounded w-full" placeholder="Contoh: 25000" />
          </div>

          <div className="border rounded p-4 mb-4">
            <h3 className="font-semibold mb-3">Bahan-bahan yang diperlukan</h3>
            <form onSubmit={addIngredient} className="grid grid-cols-3 gap-3">
              <select value={selectedStockId} onChange={(e)=>setSelectedStockId(e.target.value)} className="border p-2 rounded">
                <option value="">Pilih Bahan</option>
                {stocks.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                ))}
              </select>
              <input type="number" min="1" value={ingredientQty} onChange={(e)=>setIngredientQty(e.target.value)} className="border p-2 rounded" placeholder="Qty" />
              <select value={ingredientUnit} onChange={(e)=>setIngredientUnit(e.target.value)} className="border p-2 rounded">
                <option value="" disabled>Pilih Unit</option>
                {selectedStock ? allowedUnitsForStock(selectedStock).map(u => (
                  <option key={u} value={u}>{labelFromUnit(u)}</option>
                )) : UNIT_OPTIONS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
              <div className="col-span-3">
                <button type="submit" className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>Tambah Bahan</button>
              </div>
            </form>

            <div className="mt-4">
              {ingredients.length === 0 ? (
                <div className="text-sm text-gray-600">Belum ada bahan ditambahkan.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead style={{ background: '#e8f5e9' }}>
                    <tr>
                      <th className="p-2 text-left">Bahan</th>
                      <th className="p-2 text-left">Qty</th>
                      <th className="p-2 text-left">Unit</th>
                      <th className="p-2 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{ing.name}</td>
                        <td className="p-2">
                          <input type="number" value={ing.qty} onChange={(e)=>updateIngredientQty(idx, e.target.value)} className="border p-1 rounded w-20" />
                        </td>
                        <td className="p-2">
                          <select value={ing.inputUnit || normalizeUnit(ing.unit)} onChange={(e)=>updateIngredientUnit(idx, e.target.value)} className="border p-1 rounded">
                            {allowedUnitsForStock({ unit: ing.unit }).map(u => (
                              <option key={u} value={u}>{labelFromUnit(u)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <button onClick={()=>openDeleteIngredient(idx, ing.name)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveProduct} className="px-4 py-2 rounded text-white" style={{ background: '#2e7d32' }}>Simpan Produk</button>
            <button onClick={()=>{ setProductName(''); setProductPrice(''); setIngredients([]); setEditingId(null) }} className="px-4 py-2 rounded bg-gray-400 text-white">Reset</button>
          </div>
        </div>

        {/* Daftar Produk */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Daftar Produk</h2>
          {products.length === 0 ? (
            <div className="text-sm text-gray-600">Belum ada produk tersimpan.</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(products.length / 5))
                const currentPage = Math.min(productsPage, totalPages)
                const start = (currentPage - 1) * 5
                const pageItems = products.slice(start, start + 5)
                return pageItems.map((p) => (
                  <div key={p.id} className="p-3 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-600">Harga: {`Rp. ${((Number(p.price) || 0).toLocaleString('en-US'))}`}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>startEditProduct(p)} className="p-1 flex items-center justify-center" aria-label="Edit">
                          <img src="/images/edit%20icon.svg" alt="Edit" className="w-4 h-4" />
                        </button>
                        <button onClick={()=>{ setConfirmDeleteProductId(p.id); setConfirmDeleteProductName(p.name) }} className="p-1 flex items-center justify-center" aria-label="Hapus">
                          <img src="/images/trash%20icon.svg" alt="Hapus" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="font-semibold mb-1">Bahan:</div>
                      <ul className="list-disc ml-5">
                        {p.ingredients.map((ing, i) => (
                        <li key={i}>{ing.name} - {ing.qty} {ing.unit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              })()}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(products.length / 5))
                const currentPage = Math.min(productsPage, totalPages)
                return (
                  <div className="mt-3">
                    <Pagination current={currentPage} total={totalPages} onChange={(p) => setProductsPage(p)} />
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
      {confirmDeleteProductId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus produk <span className="font-semibold">{confirmDeleteProductName}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDelete} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteIngredientIdx !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus bahan <span className="font-semibold">{confirmDeleteIngredientName}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteIngredient} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDeleteIngredient} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {showProductWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="font-bold text-lg mb-2">Peringatan</div>
            <div className="text-sm text-gray-700 mb-4">{productWarningText}</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowProductWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
