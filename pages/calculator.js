import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

export default function Calculator() {
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(0)
  const [purchaseQty, setPurchaseQty] = useState(100)
  const [inputUnit, setInputUnit] = useState('')
  const [result, setResult] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
      } else {
        const data = await res.json()
        setUser(data.user)
        const pres = await fetch('/api/products')
        if (pres.ok) {
          const pdata = await pres.json()
          const mapped = (Array.isArray(pdata)?pdata:[]).map(r=> ({ id: r.id, name: r.name, ingredients: (r.ingredients||[]).map(i=> ({ name: i.name, amount: Number(i.qty)||0, unit: String(i.unit||'-').toLowerCase() })) }))
          setRecipes(mapped)
          const first = mapped[0]
          if (first) { setSelectedRecipeId(String(first.id)); setSelectedIngredient(0); setInputUnit(first.ingredients[0]?.unit||'') }
        }
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    calc()
  }, [selectedRecipeId, selectedIngredient, purchaseQty, inputUnit, recipes])

  function normalizeUnit(u) {
    const m = { gram: 'gram', g: 'gram', kilogram: 'kilogram', kg: 'kilogram', mililiter: 'mililiter', ml: 'mililiter', liter: 'liter', l: 'liter', pieces: 'pieces', pcs: 'pieces' }
    return m[String(u||'').toLowerCase()] || String(u||'').toLowerCase()
  }
  function convert(val, from, to) {
    const f = normalizeUnit(from)
    const t = normalizeUnit(to)
    if (f === t) return Number(val)
    if (f === 'gram' && t === 'kilogram') return Number(val) / 1000
    if (f === 'kilogram' && t === 'gram') return Number(val) * 1000
    if (f === 'mililiter' && t === 'liter') return Number(val) / 1000
    if (f === 'liter' && t === 'mililiter') return Number(val) * 1000
    return Number(val)
  }
  function calc() {
    const recipe = recipes.find((r) => String(r.id) === String(selectedRecipeId))
    if (!recipe || !recipe.ingredients[selectedIngredient]) return
    const ingredient = recipe.ingredients[selectedIngredient]
    const qtyInIngredientUnit = convert(purchaseQty, inputUnit || ingredient.unit, ingredient.unit)
    const orders = Math.floor(qtyInIngredientUnit / Number(ingredient.amount || 1))
    const totalUsed = orders * Number(ingredient.amount || 0)
    const remaining = qtyInIngredientUnit - totalUsed
    setResult({ orders, ingredient, totalUsed, remaining, recipeName: recipe.name })
  }

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Kalkulator Pembelian</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Hitung Jumlah Order dari Pembelian Bahan</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Pilih Menu Matcha</label>
              <select
                value={selectedRecipeId}
                onChange={(e) => { setSelectedRecipeId(String(e.target.value)); setSelectedIngredient(0); const r = recipes.find(rr=>String(rr.id)===String(e.target.value)); setInputUnit(r?.ingredients?.[0]?.unit||'') }}
                className="w-full border p-2 rounded"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Pilih Bahan Utama</label>
              <select
                value={selectedIngredient}
                onChange={(e) => { const idx = Number(e.target.value); setSelectedIngredient(idx); const r = recipes.find(rr=>String(rr.id)===String(selectedRecipeId)); const ing = r?.ingredients?.[idx]; setInputUnit(ing?.unit||'') }}
                className="w-full border p-2 rounded"
              >
                {recipes
                  .find((r) => r.id === Number(selectedRecipeId))
                  ?.ingredients.map((ing, idx) => (
                    <option key={idx} value={idx}>
                      {ing.name} ({ing.amount} {ing.unit} per order)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Jumlah Bahan yang Dibeli</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(Number(e.target.value))}
                  className="flex-1 border p-2 rounded"
                />
                {(() => {
                  const u = normalizeUnit(result?.ingredient?.unit || inputUnit)
                  if (u === 'gram' || u === 'kilogram') {
                    return (
                      <select value={inputUnit} onChange={(e)=>setInputUnit(e.target.value)} className="px-3 py-2 border rounded">
                        <option value="gram">gram</option>
                        <option value="kilogram">kilogram</option>
                      </select>
                    )
                  }
                  if (u === 'mililiter' || u === 'liter') {
                    return (
                      <select value={inputUnit} onChange={(e)=>setInputUnit(e.target.value)} className="px-3 py-2 border rounded">
                        <option value="mililiter">mililiter</option>
                        <option value="liter">liter</option>
                      </select>
                    )
                  }
                  return (
                    <span className="px-3 py-2" style={{ background: '#e0e0e0', borderRadius: '4px' }}>
                      {u || '-'}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow" style={{ borderTop: '4px solid #2e7d32' }}>
            <h2 className="font-bold mb-4">Hasil Kalkulasi</h2>
            <div className="space-y-4">
              <div className="p-3 rounded" style={{ background: '#e8f5e9' }}>
                <div className="text-sm text-gray-600">Dapat Membuat Order</div>
                <div className="text-4xl font-bold" style={{ color: '#2e7d32' }}>
                  {result.orders}
                </div>
                <div className="text-sm">× {result.recipeName}</div>
              </div>

              <div className="p-3 rounded" style={{ background: '#fff3e0' }}>
                <div className="text-sm text-gray-600">Bahan Digunakan</div>
                <div className="text-2xl font-bold" style={{ color: '#f57c00' }}>
                  {result.totalUsed} {result.ingredient.unit}
                </div>
              </div>

              <div className="p-3 rounded" style={{ background: '#ffebee' }}>
                <div className="text-sm text-gray-600">Sisa Bahan</div>
                <div className="text-2xl font-bold" style={{ color: '#d32f2f' }}>
                  {result.remaining} {result.ingredient.unit}
                </div>
              </div>

              <div className="p-4 rounded" style={{ background: '#f5f5f5' }}>
                <strong>Detail:</strong>
                <div className="text-sm mt-2 space-y-1">
                  <div>Menu: <strong>{result.recipeName}</strong></div>
                  <div>Bahan: <strong>{result.ingredient.name}</strong></div>
                  <div>Kebutuhan per order: <strong>{result.ingredient.amount} {result.ingredient.unit}</strong></div>
                  <div>Dibeli: <strong>{purchaseQty} {normalizeUnit(inputUnit || result.ingredient.unit)}</strong></div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

