import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function Finance() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('kelola')
  const [transactions, setTransactions] = useState([])
  const [manualType, setManualType] = useState('expense')
  const [manualAmount, setManualAmount] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualSource, setManualSource] = useState('')
  const [summary, setSummary] = useState(null)
  const [forecast, setForecast] = useState({ history: [], forecast: [] })
  const [salesOrders, setSalesOrders] = useState([])
  const [stocksData, setStocksData] = useState([])
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [hppInputs, setHppInputs] = useState('')
  const [hppServings, setHppServings] = useState(1)
  const [hppResult, setHppResult] = useState(null)
  const [bepFixed, setBepFixed] = useState('')
  const [bepVarPerUnit, setBepVarPerUnit] = useState('')
  const [bepPrice, setBepPrice] = useState('')
  const [bepUnits, setBepUnits] = useState(null)
  const [salesProducts, setSalesProducts] = useState([])
  const [active, setActive] = useState('dashboard')
  const [chartPeriod, setChartPeriod] = useState('week')
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [cashRows, setCashRows] = useState([])
  const [cfFrom, setCfFrom] = useState('')
  const [cfTo, setCfTo] = useState('')
  const [cashFlow, setCashFlow] = useState({ ops: 0, net: 0 })
  const [agingRows, setAgingRows] = useState([])
  const [q, setQ] = useState('')
  const [minAmt, setMinAmt] = useState('')
  const [maxAmt, setMaxAmt] = useState('')
  const [budgets, setBudgets] = useState([])
  const [budgetPeriod, setBudgetPeriod] = useState('')
  const [budgetIncome, setBudgetIncome] = useState('')
  const [budgetPlan, setBudgetPlan] = useState({ 'Bahan Baku': '', 'Sewa Tempat': '', 'Gaji Karyawan': '', 'Listrik & Air': '', 'Marketing': '', 'Transportasi': '', 'Perawatan': '', 'Lainnya': '' })
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [forecasts, setForecasts] = useState([])
  const [forecastStartDate, setForecastStartDate] = useState('')
  const [forecastMonths, setForecastMonths] = useState(3)
  const [forecastInitialBalance, setForecastInitialBalance] = useState('')
  const [selectedForecast, setSelectedForecast] = useState(null)
  const [selectedForecastNoteId, setSelectedForecastNoteId] = useState(null)
  const [manualKind, setManualKind] = useState('pendapatan')
  const [manualCategory, setManualCategory] = useState('Penjualan Barang')
  const [manualSubCategory, setManualSubCategory] = useState('')
  const [manualMethod, setManualMethod] = useState('Cash')
  const [editingManualId, setEditingManualId] = useState(null)
  const [showFinanceWarning, setShowFinanceWarning] = useState(false)
  const [financeWarningText, setFinanceWarningText] = useState('')
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState(null)
  const [confirmDeleteBudgetPeriod, setConfirmDeleteBudgetPeriod] = useState('')
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null)
  const [confirmDeleteTxDesc, setConfirmDeleteTxDesc] = useState('')
  const historyChartRef = useRef(null)
  const forecastChartRef = useRef(null)
  const monthlyChartRef = useRef(null)
  const pieChartRef = useRef(null)
  const revenuePieRef = useRef(null)
  const cogsPieRef = useRef(null)
  const profitPieRef = useRef(null)
  const revenuePieFullRef = useRef(null)
  const cogsPieFullRef = useRef(null)
  const profitPieFullRef = useRef(null)
  const [showRevenuePie, setShowRevenuePie] = useState(false)
  const [showCogsPie, setShowCogsPie] = useState(false)
  const [showProfitPie, setShowProfitPie] = useState(false)
  const PIE_COLORS = ['#2e7d32','#f57c00','#d32f2f','#1976d2','#9c27b0','#009688','#ff5722','#00bcd4','#8bc34a','#ffc107']
  const rankMenuData = useMemo(() => {
    const map = {}
    const paidOrders = (salesOrders||[]).filter(o=>!!o.paid)
    paidOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const name = item.name
        const qty = Number(item.quantity) || 0
        map[name] = (map[name] || 0) + qty
      })
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const max = Math.max(1, ...sorted.map(s=>s[1]))
    return {
      labels: sorted.map(s => s[0]),
      datasets: [{
        label: 'Terjual (%)',
        data: sorted.map(s => Math.round(s[1] / max * 100)),
        backgroundColor: '#2e7d32',
        borderRadius: 4,
      }]
    }
  }, [salesOrders])

  const salesAnalyticsData = useMemo(() => {
    const map = {}
    const now = new Date()
    let labels = []
    
    if (chartPeriod === 'week') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const label = days[d.getDay()]
        labels.push(label)
        map[label] = 0
      }
    } else if (chartPeriod === 'month') {
       const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
       for (let i = 1; i <= daysInMonth; i++) {
         labels.push(String(i))
         map[String(i)] = 0
       }
    } else { 
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      labels = months
      months.forEach(m => map[m] = 0)
    }

    const paidOrders = (salesOrders||[]).filter(o=>!!o.paid)
    paidOrders.forEach(order => {
      const d = new Date(order.createdAt)
      const qty = (order.items||[]).reduce((a,b)=>a+(Number(b.quantity)||0),0)
      
      if (chartPeriod === 'week') {
        const oneDay = 24 * 60 * 60 * 1000
        const diffDays = Math.round(Math.abs((now - d) / oneDay))
        if (diffDays <= 7) {
           const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
           map[days[d.getDay()]] += qty
        }
      } else if (chartPeriod === 'month') {
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
           map[String(d.getDate())] += qty
        }
      } else { 
        if (d.getFullYear() === now.getFullYear()) {
           const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
           map[months[d.getMonth()]] += qty
        }
      }
    })

    return {
      labels,
      datasets: [{
        label: 'Total Menu Terjual',
        data: labels.map(l => map[l]),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.2)',
        tension: 0.4,
        fill: true,
      }]
    }
  }, [salesOrders, chartPeriod])

  const vizIncomeRef = useRef(null)
  const vizExpenseRef = useRef(null)
  const vizDailyRef = useRef(null)
  const vizMenuRef = useRef(null)
  const vizStockRef = useRef(null)
  const router = useRouter()

useEffect(() => {
  async function checkAuth() {
    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      router.push('/login')
    } else {
      const data = await res.json()
      setUser(data.user)
    }
  }
  checkAuth()
}, [])

useEffect(() => {
  if (!user) return
  ;(async()=>{
    try {
      const tx = await fetch('/api/finance/transactions?includeAuto=true').then(r=>r.json())
      setTransactions(Array.isArray(tx)?tx:[])
      const sum = await fetch('/api/finance/summary').then(r=>r.json()).catch(()=>null)
      setSummary(sum)
      const sales = await fetch('/api/sales').then(r=>r.json()).catch(()=>[])
      setSalesOrders(Array.isArray(sales)?sales:[])
      const prods = await fetch('/api/products').then(r=>r.json()).catch(()=>[])
      setSalesProducts(Array.isArray(prods)?prods:[])
      const rows = (Array.isArray(sales)?sales:[]).filter(o=>!o.paid).map(o=>{
        const createdAt = o.createdAt ? new Date(o.createdAt) : new Date()
        const days = Math.max(0, Math.round((Date.now()-createdAt.getTime())/(1000*60*60*24)))
        let category = 'Current'
        if (days>90) category='90+ Days'; else if (days>60) category='61-90 Days'; else if (days>30) category='31-60 Days'; else if (days>0) category='1-30 Days'
        const amount = Number(o.total)||0
        return { name: o.customerName || '-', amount, days, category }
      })
      setAgingRows(rows)
      const notes = await fetch('/api/notes').then(r=>r.json()).catch(()=>[])
      const bs = []
      const fs = []
      for (const n of (Array.isArray(notes)?notes:[])) {
        if (n.title === 'BUDGET') {
          try { const obj = JSON.parse(n.content||'{}'); bs.push({ ...obj, noteId: n.id }) } catch {}
        }
        if (n.title === 'FORECAST') {
          try { const obj = JSON.parse(n.content||'{}'); fs.push({ ...obj, noteId: n.id }) } catch {}
        }
      }
      setBudgets(bs)
      setForecasts(fs)
    } catch {}
  })()
}, [user])

  async function createBudget() {
    const expense_plan = {}
    Object.keys(budgetPlan).forEach(k=>{ const v = parseInt(String(budgetPlan[k]).replace(/[^\d]/g,''))||0; expense_plan[k] = v })
    const income_target = parseInt(String(budgetIncome).replace(/[^\d]/g,''))||0
    const total_expense_plan = Object.values(expense_plan).reduce((a,b)=>a+(b||0),0)
    const net_target = income_target - total_expense_plan
    const payload = { period: budgetPeriod || new Date().toISOString().slice(0,7), created_date: new Date().toISOString().slice(0,10), income_target, expense_plan, total_expense_plan, net_target, created_by_email: (user?.email||null), created_by_name: (user?.name||user?.fullName||null) }
    const r = await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:'BUDGET', content: JSON.stringify(payload) }) })
    if (r.ok) {
      const n = await r.json()
      setBudgets(prev=>[{ ...payload, noteId: n.id }, ...prev])
      setBudgetPeriod(''); setBudgetIncome(''); setBudgetPlan({ 'Bahan Baku': '', 'Sewa Tempat': '', 'Gaji Karyawan': '', 'Listrik & Air': '', 'Marketing': '', 'Transportasi': '', 'Perawatan': '', 'Lainnya': '' })
      try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Membuat Anggaran: Periode ${payload.period} • Target Pendapatan Rp ${(Number(payload.income_target)||0).toLocaleString('id-ID')}` }) }) } catch {}
    }
  }

  async function saveBudgetUpdate() {
    if (!selectedBudget) return
    const expense_plan = Object.fromEntries(Object.entries(selectedBudget.expense_plan||{}).map(([k,v])=>[k, parseInt(String(v).replace(/[^\d]/g,''))||0]))
    const income_target = parseInt(String(selectedBudget.income_target).replace(/[^\d]/g,''))||0
    const total_expense_plan = Object.values(expense_plan).reduce((a,b)=>a+(Number(b)||0),0)
    const net_target = income_target - total_expense_plan
    const payload = { ...selectedBudget, total_expense_plan, net_target }
    if (selectedBudget.noteId) await fetch('/api/notes', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: selectedBudget.noteId }) })
    const r = await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:'BUDGET', content: JSON.stringify(payload) }) })
    if (r.ok) {
      const n = await r.json()
      setBudgets(prev=>[{ ...payload, noteId: n.id }, ...prev.filter(b=>b.noteId!==selectedBudget.noteId)])
      setSelectedBudget({ ...payload, noteId: n.id })
      try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Memperbarui Anggaran: Periode ${payload.period}` }) }) } catch {}
    }
  }

  function computeBudgetAnalysis(budget) {
    if (!budget) return null
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = today
    const filtered = (transactions||[]).filter(t=>{ const dt = new Date(t.date); return dt>=start && dt<=end })
    const actual_income = filtered.filter(t=>t.type==='income').reduce((a,b)=>a+(Number(b.amount)||0),0)
    const actual_expensesMap = {}
    filtered.filter(t=>t.type==='expense').forEach(t=>{ const cat=(t.source||'lainnya'); actual_expensesMap[cat]=(actual_expensesMap[cat]||0)+(Number(t.amount)||0) })
    const rows = []
    const variance_income = actual_income - (Number(budget.income_target)||0)
    const variance_pct_income = (variance_income / (Number(budget.income_target)||1)) * 100
    rows.push({ kategori:'PENDAPATAN', budget:Number(budget.income_target)||0, actual:actual_income, variance:variance_income, variancePct:variance_pct_income })
    let total_budget_exp=0, total_actual_exp=0
    for (const [category, budget_amount] of Object.entries(budget.expense_plan||{})) {
      const actual_amount = actual_expensesMap[category]||0
      const variance = actual_amount - (Number(budget_amount)||0)
      const variancePct = (variance / ((Number(budget_amount)||0) || 1)) * 100
      total_budget_exp += Number(budget_amount)||0
      total_actual_exp += actual_amount
      rows.push({ kategori: category, budget: Number(budget_amount)||0, actual: actual_amount, variance, variancePct })
    }
    const total_variance_exp = total_actual_exp - total_budget_exp
    const total_variance_pct_exp = (total_variance_exp / (total_budget_exp || 1)) * 100
    const budget_net = (Number(budget.income_target)||0) - total_budget_exp
    const actual_net = actual_income - total_actual_exp
    const net_variance = actual_net - budget_net
    const net_variance_pct = (net_variance / (budget_net || 1)) * 100
    return { rows, totals: { total_budget_exp, total_actual_exp, total_variance_exp, total_variance_pct_exp, budget_net, actual_net, net_variance, net_variance_pct } }
  }

  async function createForecast() {
    const start_date = forecastStartDate || (()=>{ const d=new Date(); const nm=new Date(d.getFullYear(), d.getMonth()+1, 1); return nm.toISOString().slice(0,10) })()
    const months = Math.max(1, Math.min(12, Number(forecastMonths)||3))
    const initial_balance = forecastInitialBalance ? (parseFloat(String(forecastInitialBalance).replace(/,/g,''))||0) : ((summary?.balanceSheet?.cash)||0)
    const monthly_data = []
    let current = new Date(start_date)
    for (let i=0;i<months;i++){ const month = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`; monthly_data.push({ month, projected_income: 0, projected_expenses: 0, projected_balance: initial_balance, notes: '' }); current = new Date(current.getFullYear(), current.getMonth()+1, 1) }
    const payload = { start_date, months, initial_balance, monthly_data, created_date: new Date().toISOString().slice(0,10) }
    const r = await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:'FORECAST', content: JSON.stringify(payload) }) })
    if (r.ok) {
      const n = await r.json()
      const obj = { ...payload, noteId: n.id }
      setForecasts(prev=>[obj, ...prev])
      setSelectedForecast(obj); setSelectedForecastNoteId(n.id)
      setForecastStartDate(''); setForecastMonths(3); setForecastInitialBalance('')
      try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Membuat Proyeksi: Mulai ${start_date} • ${months} bulan • Saldo Awal Rp ${(Number(initial_balance)||0).toLocaleString('id-ID')}` }) }) } catch {}
    }
  }

  function recalcForecastBalances(f) {
    if (!f) return f
    let balance = Number(f.initial_balance)||0
    const md = (f.monthly_data||[]).map((m,i)=>{ const inc=Number(m.projected_income)||0; const exp=Number(m.projected_expenses)||0; const pb = i===0 ? (balance + inc - exp) : (((md[i-1]||{}).projected_balance)||0) + inc - exp; return { ...m, projected_balance: pb } })
    return { ...f, monthly_data: md }
  }

  async function saveForecast() {
    if (!selectedForecast) return
    const f = recalcForecastBalances(selectedForecast)
    if (selectedForecastNoteId) await fetch('/api/notes', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: selectedForecastNoteId }) })
    const r = await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:'FORECAST', content: JSON.stringify(f) }) })
    if (r.ok) {
      const n = await r.json()
      setForecasts(prev=>[f, ...prev.filter(x=>x.noteId!==selectedForecastNoteId)])
      setSelectedForecastNoteId(n.id)
      setSelectedForecast({ ...f, noteId: n.id })
      try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Menyimpan Proyeksi: Mulai ${f.start_date} • ${f.months} bulan` }) }) } catch {}
    }
  }

  function generateCashBook() {
    const m = month
    const monthTx = (transactions||[]).filter(t=> String(t.date||'').startsWith(m)).sort((a,b)=> new Date(a.date) - new Date(b.date))
    let running = 0
    const rows = monthTx.map(t=>{
      const debit = t.type==='income' ? Number(t.amount)||0 : 0
      const credit = t.type==='expense' ? Number(t.amount)||0 : 0
      running += debit - credit
      const d = new Date(t.date)
      const tanggal = String(d.getDate()).padStart(2,'0')
      return { tanggal, keterangan: t.description||'-', debit: debit||null, kredit: credit||null, saldo: running }
    })
    setCashRows(rows)
  }

  async function confirmDeleteBudget() {
    if (!confirmDeleteBudgetId) return
    await fetch('/api/notes', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: confirmDeleteBudgetId }) })
    setBudgets(prev=>prev.filter(x=> (x.noteId||'') !== (confirmDeleteBudgetId||'')))
    if (selectedBudget && selectedBudget.noteId === confirmDeleteBudgetId) { setSelectedBudget(null) }
    setConfirmDeleteBudgetId(null)
    setConfirmDeleteBudgetPeriod('')
  }

  function cancelDeleteBudget() {
    setConfirmDeleteBudgetId(null)
    setConfirmDeleteBudgetPeriod('')
  }

  async function confirmDeleteTx() {
    if (!confirmDeleteTxId) return
    const r = await fetch(`/api/finance/transactions?id=${confirmDeleteTxId}`, { method:'DELETE' })
    if (r.ok){ setTransactions(prev=>prev.filter(x=>x.id!==confirmDeleteTxId)) }
    setConfirmDeleteTxId(null)
    setConfirmDeleteTxDesc('')
  }

  function cancelDeleteTx() {
    setConfirmDeleteTxId(null)
    setConfirmDeleteTxDesc('')
  }

  function exportCashBookCsv() {
    const header = 'Tanggal;Keterangan;Debit;Kredit;Saldo\n'
    const body = (cashRows||[]).map(r=>`${r.tanggal};${r.keterangan};${r.debit||''};${r.kredit||''};${r.saldo}`).join('\n')
    const blob = new Blob([header+body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buku_kas_${month}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function calcCashFlow() {
    const from = cfFrom || new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10)
    const to = cfTo || new Date().toISOString().slice(0,10)
    const rngTx = (transactions||[]).filter(t=>{ const d = (t.date||'').slice(0,10); return d>=from && d<=to })
    const opsIncome = rngTx.filter(t=>t.type==='income').reduce((a,b)=>a+(Number(b.amount)||0),0)
    const opsExpense = rngTx.filter(t=>t.type==='expense').reduce((a,b)=>a+(Number(b.amount)||0),0)
    const opsNet = opsIncome - opsExpense
    setCashFlow({ ops: opsNet, net: opsNet })
  }

  function exportTransactionsCsv() {
    const rows = (transactions||[]).map(t=>({ tanggal: new Date(t.date).toLocaleString('id-ID'), jenis: t.type, jumlah: Number(t.amount)||0, sumber: t.source||'', deskripsi: t.description||'' }))
    const header = 'Tanggal;Jenis;Jumlah;Sumber;Deskripsi\n'
    const body = rows.map(r=>`${r.tanggal};${r.jenis};${r.jumlah};${r.sumber};${r.deskripsi}`).join('\n')
    const blob = new Blob([header+body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaksi.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function toNumber(val){ return parseInt(String(val||'').replace(/[^\d]/g,''))||0 }

  function exportBackupJson() {
    const payload = { transaksi: transactions }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup_finance.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const searchRows = useMemo(()=>{
    let arr = transactions || []
    if (q) {
      const s = q.toLowerCase()
      arr = arr.filter(t => (t.description||'').toLowerCase().includes(s) || (t.source||'').toLowerCase().includes(s))
    }
    if (minAmt) {
      const min = parseFloat(minAmt) || 0
      arr = arr.filter(t => (Number(t.amount)||0) >= min)
    }
    if (maxAmt) {
      const max = parseFloat(maxAmt) || 0
      arr = arr.filter(t => (Number(t.amount)||0) <= max)
    }
    return arr
  }, [transactions, q, minAmt, maxAmt])

  async function loadAll() {
    const tx = await fetch(`/api/finance/transactions?includeAuto=true${rangeFrom?`&from=${rangeFrom}`:''}${rangeTo?`&to=${rangeTo}`:''}`).then(r=>r.json())
    setTransactions(tx)
    const sum = await fetch(`/api/finance/summary${rangeFrom?`?from=${rangeFrom}`:''}${rangeFrom&&rangeTo?`&to=${rangeTo}`:(!rangeFrom&&rangeTo?`?to=${rangeTo}`:'')}`).then(r=>r.json())
    setSummary(sum)
    const fc = await fetch('/api/finance/forecast?horizon=7&group=day').then(r=>r.json())
    setForecast(fc)
    const prods = await fetch('/api/products').then(r=>r.json()).catch(()=>[])
    setSalesProducts(Array.isArray(prods)?prods:[])
    const sales = await fetch('/api/sales').then(r=>r.json()).catch(()=>[])
    setSalesOrders(Array.isArray(sales)?sales:[])
    const stocks = await fetch('/api/stocks').then(r=>r.json()).catch(()=>[])
    setStocksData(Array.isArray(stocks)?stocks:[])
  }

  async function saveManualTx() {
    const typeMap = { pendapatan: 'income', beban: 'expense', aset: 'expense', liabilitas: 'income' }
    const type = typeMap[manualKind] || 'expense'
    const amountNum = parseInt(String(manualAmount).replace(/[^\d]/g,''))||0
    if (!manualDate || String(manualDate).trim() === '' || !manualCategory || String(manualCategory).trim() === '' || !manualMethod || String(manualMethod).trim() === '' || !manualDesc || String(manualDesc).trim() === '' || amountNum <= 0) {
      setFinanceWarningText('Semua kolom harus diisi dan dipilih')
      setShowFinanceWarning(true)
      return
    }
    const payload = { type, amount: amountNum, date: manualDate || new Date().toISOString().slice(0,10), description: manualDesc || '', source: manualCategory || '', category: manualCategory || '', subCategory: manualSubCategory || null, method: manualMethod || null, kind: manualKind }
    if (editingManualId) {
      const r = await fetch(`/api/finance/transactions?id=${editingManualId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (r.ok) {
        const up = await r.json()
        setTransactions(prev=>prev.map(t=>t.id===editingManualId? up: t))
        setEditingManualId(null)
        try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Mengubah Transaksi Manual #${editingManualId} • ${type.toUpperCase()} • Rp ${(amountNum||0).toLocaleString('id-ID')} • ${payload.category || '-'}` }) }) } catch {}
      }
    } else {
      const r = await fetch('/api/finance/transactions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (r.ok) {
        const created = await r.json()
        setTransactions(prev=>[created, ...prev])
        try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Menambah Transaksi Manual • ${type.toUpperCase()} • Rp ${(amountNum||0).toLocaleString('id-ID')} • ${payload.category || '-'}` }) }) } catch {}
      }
    }
    setManualDate(''); setManualDesc(''); setManualSource(''); setManualAmount(''); setManualSubCategory('')
    try { const sum = await fetch('/api/finance/summary').then(r=>r.json()); setSummary(sum) } catch {}
  }

  async function deleteManualTx(id) {
    if (!id) return
    const r = await fetch(`/api/finance/transactions?id=${id}`, { method:'DELETE' })
    if (r.ok) { setTransactions(prev=>prev.filter(t=>t.id!==id)); try { await fetch('/api/finance/logs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: `Menghapus Transaksi Manual #${id}` }) }) } catch {} }
    try { const sum = await fetch('/api/finance/summary').then(r=>r.json()); setSummary(sum) } catch {}
  }

  async function saveManualSimple() {
    const amountNum = parseInt(String(manualAmount).replace(/[^\d]/g,''))||0
    if (!manualDate || String(manualDate).trim() === '' || !manualSource || String(manualSource).trim() === '' || !manualDesc || String(manualDesc).trim() === '' || amountNum <= 0) {
      setFinanceWarningText('Semua kolom harus diisi dan dipilih')
      setShowFinanceWarning(true)
      return
    }
    const payload = { type: manualType, amount: amountNum, date: manualDate || undefined, description: manualDesc, source: manualSource }
    const r = await fetch('/api/finance/transactions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if (r.ok){ const created = await r.json(); setTransactions(prev=>[created, ...prev]); setManualAmount(''); setManualDate(''); setManualDesc(''); setManualSource('') }
  }

  function drawLine(canvas, series, color) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0,0,w,h)
    const max = Math.max(1, ...series)
    const stepX = w / Math.max(1, series.length - 1)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    series.forEach((v,i)=>{
      const x = i * stepX
      const y = h - (v / max) * (h - 10) - 5
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    })
    ctx.stroke()
  }

  function drawBars(canvas, series, color) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0,0,w,h)
    const max = Math.max(1, ...series.map(s=>s.value))
    const bw = Math.max(10, w / Math.max(1, series.length * 1.5))
    series.forEach((s,i)=>{
      const x = i * (bw * 1.5) + 10
      const barH = (s.value / max) * (h - 20)
      ctx.fillStyle = color
      ctx.fillRect(x, h - barH - 10, bw, barH)
    })
  }

  function drawPie(canvas, parts, colors = PIE_COLORS) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0,0,w,h)
    const total = parts.reduce((a,b)=>a + (Number(b.value)||0), 0) || 1
    let start = 0
    parts.forEach((p,i)=>{
      const val = Number(p.value)||0
      const angle = (val / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(w/2,h/2)
      ctx.arc(w/2,h/2, Math.min(w,h)/2 - 5, start, start + angle)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      start += angle
    })
  }

  function makeColors(n) {
    const out = []
    for (let i = 0; i < Math.max(1, n); i++) {
      const h = Math.round((i * 360) / Math.max(1, n))
      out.push(`hsl(${h}, 70%, 55%)`)
    }
    return out
  }

  function textColorFor(bg) {
    try {
      const m = bg.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/)
      if (m) { const l = parseInt(m[3],10); return l > 60 ? '#222' : '#fff' }
    } catch {}
    return '#fff'
  }

  function drawPieAnimated(canvas, parts, colors) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 6
    const total = parts.reduce((a,b)=>a + (Number(b.value)||0), 0) || 1
    const segs = parts.map(p=>({ value: Number(p.value)||0 }))
    const cols = (colors && colors.length >= segs.length) ? colors : makeColors(segs.length)
    let startTs = null
    function render(ts) {
      if (startTs == null) startTs = ts
      const t = Math.min(1, (ts - startTs) / 900)
      ctx.clearRect(0,0,w,h)
      let start = 0
      segs.forEach((s,i)=>{
        const angle = (s.value / total) * Math.PI * 2
        const cur = angle * t
        ctx.beginPath()
        ctx.moveTo(cx,cy)
        ctx.arc(cx,cy,r, start, start + cur)
        ctx.closePath()
        ctx.fillStyle = cols[i % cols.length]
        ctx.fill()
        start += angle
      })
      if (t < 1) {
        requestAnimationFrame(render)
      } else {
        let s0 = 0
        const pos = []
        segs.forEach((s,i)=>{ const angle = (s.value / total) * Math.PI * 2; const mid = s0 + angle/2; pos.push({ i, mid, value: s.value, color: cols[i % cols.length] }); s0 += angle })
        const left = pos.filter(p=>Math.cos(p.mid)<0).sort((a,b)=>Math.sin(a.mid)-Math.sin(b.mid))
        const right = pos.filter(p=>Math.cos(p.mid)>=0).sort((a,b)=>Math.sin(a.mid)-Math.sin(b.mid))
        function drawSide(arr, side){
          const top = cy - r + 12
          const bottom = cy + r - 12
          const step = arr.length>1 ? (bottom - top) / (arr.length - 1) : 0
          arr.forEach((p,idx)=>{
            const y = arr.length>1 ? top + idx*step : cy
            const bx = side==='right' ? cx + r + 18 : cx - r - 18
            const tx = side==='right' ? bx + 16 : bx - 16
            ctx.save()
            ctx.fillStyle = p.color
            ctx.fillRect(bx-6, y-6, 12, 12)
            ctx.restore()
            ctx.save()
            ctx.fillStyle = '#333'
            ctx.font = '12px sans-serif'
            ctx.textAlign = side==='right' ? 'left' : 'right'
            ctx.textBaseline = 'middle'
            const pct = Math.round((p.value/total)*1000)/10
            ctx.fillText(`#${p.i+1} - ${pct}%`, tx, y)
            ctx.restore()
            const sx = cx + (r+4) * Math.cos(p.mid)
            const sy = cy + (r+4) * Math.sin(p.mid)
            ctx.save()
            ctx.strokeStyle = p.color
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(bx, y)
            ctx.stroke()
            ctx.restore()
          })
        }
        drawSide(left,'left');
        drawSide(right,'right')
      }
    }
    requestAnimationFrame(render)
  }

  useEffect(()=>{
    generateCashBook()
  }, [transactions, month])

  useEffect(()=>{
    if (forecast && forecast.history) drawLine(historyChartRef.current, forecast.history, '#1976d2')
    if (forecast && forecast.forecast) drawLine(forecastChartRef.current, forecast.forecast, '#2e7d32')
    if (summary) {
      drawBars(monthlyChartRef.current, summary.charts.revenueMonthly, '#2e7d32')
      drawPie(revenuePieRef.current, summary.charts.pieRevenue || [], makeColors((summary.charts.pieRevenue||[]).length))
      drawPie(cogsPieRef.current, summary.charts.pieCogs || [], makeColors((summary.charts.pieCogs||[]).length))
      drawPie(profitPieRef.current, summary.charts.pieProfit || [], makeColors((summary.charts.pieProfit||[]).length))
      const dailySeries = (summary.charts.timeSeriesRevenueDaily||[]).map(s=>s.value)
      drawLine(vizDailyRef.current, dailySeries, '#2e7d32')
    }
    if (transactions && transactions.length) {
      const mapIncome = {}
      const mapExpense = {}
      transactions.forEach(t=>{
        const d = new Date(t.date)
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (t.type === 'income') mapIncome[key] = (mapIncome[key]||0) + (Number(t.amount)||0)
        if (t.type === 'expense') mapExpense[key] = (mapExpense[key]||0) + (Number(t.amount)||0)
      })
      const incSeries = Object.entries(mapIncome).sort((a,b)=>a[0].localeCompare(b[0])).map(([_,v])=>v)
      const expSeries = Object.entries(mapExpense).sort((a,b)=>a[0].localeCompare(b[0])).map(([_,v])=>v)
      drawLine(vizIncomeRef.current, incSeries, '#2e7d32')
      drawLine(vizExpenseRef.current, expSeries, '#d32f2f')
    }
    if (salesOrders && salesOrders.length) {
      const agg = {}
      salesOrders.forEach(o=>{ (o.items||[]).forEach(it=>{ agg[it.name] = (agg[it.name]||0) + ((Number(it.price)||0) * (Number(it.quantity)||0)) }) })
      const series = Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({ label: name, value }))
      drawBars(vizMenuRef.current, series, '#2e7d32')
    }
    if (stocksData && stocksData.length) {
      const series = stocksData.map(s=>({ label: s.name, value: Math.max(0, Number(s.quantity)||0) }))
      drawBars(vizStockRef.current, series, '#66CDAA')
    }
  }, [forecast, summary, transactions, salesOrders, stocksData])

  useEffect(()=>{
    if (active !== 'income_statement') return
    if (!summary) return
    drawPie(revenuePieRef.current, summary.charts.pieRevenue || [], makeColors((summary.charts.pieRevenue||[]).length))
    drawPie(cogsPieRef.current, summary.charts.pieCogs || [], makeColors((summary.charts.pieCogs||[]).length))
    drawPie(profitPieRef.current, summary.charts.pieProfit || [], makeColors((summary.charts.pieProfit||[]).length))
  }, [active, summary])

  useEffect(()=>{
    if (!summary) return
    if (showRevenuePie) drawPieAnimated(revenuePieFullRef.current, summary.charts.pieRevenue || [], makeColors((summary.charts.pieRevenue||[]).length))
    if (showCogsPie) drawPieAnimated(cogsPieFullRef.current, summary.charts.pieCogs || [], makeColors((summary.charts.pieCogs||[]).length))
    if (showProfitPie) drawPieAnimated(profitPieFullRef.current, summary.charts.pieProfit || [], makeColors((summary.charts.pieProfit||[]).length))
  }, [showRevenuePie, showCogsPie, showProfitPie, summary])

  if (!user) return <div>Loading...</div>

  return (
    <Layout user={user}>
      <div className="rounded-full bg-white shadow px-3 py-2 flex items-center justify-center gap-2 mb-4" style={{ border: '1px solid #e0e0e0' }}>
         <button title="Dashboard" onClick={()=>setActive('dashboard')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='dashboard'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
           <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='dashboard' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/dashboard.svg)', maskImage: 'url(/images/dashboard.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
         </button>
         <button title="Input Manual" onClick={()=>setActive('manual')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='manual'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
           <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='manual' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/inputfinance.svg)', maskImage: 'url(/images/inputfinance.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
         </button>
        <button title="Laba Rugi" onClick={()=>setActive('income_statement')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='income_statement'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
          <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='income_statement' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/analyticsfinance.svg)', maskImage: 'url(/images/analyticsfinance.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
        </button>
        <button title="Cari" onClick={()=>setActive('search')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='search'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
          <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='search' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/searchfinance.svg)', maskImage: 'url(/images/searchfinance.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
        </button>
        
        <button title="Anggaran" onClick={()=>setActive('budgeting')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='budgeting'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
          <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='budgeting' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/anggaranfinance.svg)', maskImage: 'url(/images/anggaranfinance.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
        </button>
        <button title="Budget vs Actual" onClick={()=>setActive('budget_analysis')} className={`w-10 h-10 rounded-full flex items-center justify-center ${active==='budget_analysis'?'bg-[#2e7d32] text-white':'bg-[#e8f5e9]'}`}>
          <span style={{ width:20, height:20, display:'inline-block', backgroundColor: active==='budget_analysis' ? '#ffffff' : '#ff4081', WebkitMaskImage: 'url(/images/financedashboard.svg)', maskImage: 'url(/images/financedashboard.svg)', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
        </button>
      </div>

      {active==='dashboard' && (
        <div className="space-y-6">
           {/* Laporan Buku Kas */}
           <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Laporan Buku Kas</h2>
            <div className="flex items-center gap-2 mb-3">
              <input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} className="border p-2 rounded" />
              <button onClick={generateCashBook} className="px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }} title="Tampilkan">
                <img src="/images/search.svg" alt="Tampilkan" width="18" height="18" style={{ filter:'invert(1)' }} />
              </button>
              <button onClick={exportCashBookCsv} className="px-3 py-2 rounded text-white" style={{ background:'#1976d2' }} title="Export CSV">
                <img src="/images/download%20icon.svg" alt="Export CSV" width="18" height="18" />
              </button>
            </div>
            <div className="overflow-auto max-h-96" style={{ border:'2px solid #2e7d32', borderRadius:'8px' }}>
              <table className="min-w-full text-sm">
                <thead><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Keterangan</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Kredit</th><th className="p-2 text-right">Saldo</th></tr></thead>
                <tbody>
                  {cashRows.map((row,i)=>(
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.tanggal}</td>
                      <td className="p-2">{row.keterangan}</td>
                      <td className="p-2 text-right">{row.debit?`Rp ${row.debit.toLocaleString('id-ID')}`:''}</td>
                      <td className="p-2 text-right">{row.kredit?`Rp ${row.kredit.toLocaleString('id-ID')}`:''}</td>
                      <td className="p-2 text-right">Rp {row.saldo.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Peringkat Menu Terjual Paling Banyak</h2>
            <div className="h-64">
              <Bar data={rankMenuData} options={{ maintainAspectRatio: false, scales:{ y:{ min:0, max:100, ticks:{ callback:(v)=>`${v}%` } } } }} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-bold">Performa Penjualan Produk</h2>
               <button onClick={()=>setShowPeriodModal(true)} className="px-3 py-1 text-sm rounded bg-[#2e7d32] text-white">Pilih Periode</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(() => {
                function labelsFor(period) {
                  const now = new Date()
                  if (period === 'week') {
                    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
                    const arr = []
                    for (let i=6;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); arr.push(days[d.getDay()]) }
                    return arr
                  } else if (period === 'month') {
                    const dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); return Array.from({length:dim}, (_,i)=> String(i+1))
                  } else {
                    return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
                  }
                }
                const labels = labelsFor(chartPeriod)
                function seriesForMenu(name){
                  const map = {}; labels.forEach(l=>map[l]=0)
                  const paidOrders = (salesOrders||[]).filter(x=>!!x.paid)
                  paidOrders.forEach(o=>{
                    const d = new Date(o.createdAt)
                    const qty = (o.items||[]).filter(it=>String(it.name)===String(name)).reduce((a,b)=>a+(Number(b.quantity)||0),0)
                    if (chartPeriod==='week') { const days=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']; const lbl=days[d.getDay()]; if(lbl in map) map[lbl]+=qty }
                    else if (chartPeriod==='month') { const now=new Date(); if (d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()){ const lbl=String(d.getDate()); if(lbl in map) map[lbl]+=qty } }
                    else { const months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; if (d.getFullYear()===new Date().getFullYear()){ const lbl=months[d.getMonth()]; if(lbl in map) map[lbl]+=qty } }
                  })
                  const vals = labels.map(l=>map[l])
                  const max = Math.max(1, ...vals)
                  return vals.map(v=> Math.round(v / max * 100))
                }
                return (salesProducts||[]).map(p=> (
                  <div key={p.id} className="p-3 border rounded">
                    <div className="font-semibold mb-2">{p.name}</div>
                    <div className="h-48">
                      <Line data={{ labels, datasets:[{ label:'Qty Terjual (%)', data: seriesForMenu(p.name), borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.2)', tension:0.4, fill:true }] }} options={{ maintainAspectRatio:false, scales:{ y:{ min:0, max:100, ticks:{ callback:(v)=>`${v}%` } } } }} />
                    </div>
                  </div>
                ))
              })()}
            </div>
            {showPeriodModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowPeriodModal(false)}>
                <div className="bg-white rounded-lg shadow p-4 w-72" onClick={(e)=>e.stopPropagation()}>
                  <div className="font-bold mb-3">Pilih Periode</div>
                  <div className="space-y-2">
                    <button onClick={()=>{ setChartPeriod('week'); setShowPeriodModal(false) }} className="w-full px-3 py-2 rounded bg-[#2e7d32] text-white">Mingguan</button>
                    <button onClick={()=>{ setChartPeriod('month'); setShowPeriodModal(false) }} className="w-full px-3 py-2 rounded bg-[#2e7d32] text-white">Bulanan</button>
                    <button onClick={()=>{ setChartPeriod('year'); setShowPeriodModal(false) }} className="w-full px-3 py-2 rounded bg-[#2e7d32] text-white">Tahunan</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {active==='manual' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Input Transaksi Manual</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Tanggal</label>
                <input type="date" value={manualDate} onChange={(e)=>setManualDate(e.target.value)} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="text-sm">Jenis Transaksi</label>
                <select value={manualKind} onChange={(e)=>{ setManualKind(e.target.value); setManualCategory(e.target.value==='pendapatan'?'Penjualan Barang': e.target.value==='beban'?'Bahan Baku': e.target.value==='liabilitas'?'Pinjaman Bank':'') }} className="border p-2 rounded w-full">
                  <option value="pendapatan">Pendapatan (Penjualan)</option>
                  <option value="beban">Beban (Pengeluaran)</option>
                  <option value="aset">Aset (Pembelian barang)</option>
                  <option value="liabilitas">Liabilitas (Hutang)</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Kategori</label>
                {manualKind==='pendapatan' && (
                  <select value={manualCategory} onChange={(e)=>setManualCategory(e.target.value)} className="border p-2 rounded w-full">
                    <option>Penjualan Barang</option>
                    <option>Lainnya</option>
                  </select>
                )}
                {manualKind==='beban' && (
                  <select value={manualCategory} onChange={(e)=>setManualCategory(e.target.value)} className="border p-2 rounded w-full">
                    {['Bahan Baku','Sewa Tempat','Gaji Karyawan','Listrik & Air','Internet','Marketing','Transportasi','Perawatan','Lainnya'].map(k=> <option key={k}>{k}</option>)}
                  </select>
                )}
                {manualKind==='aset' && (
                  <input value={manualCategory} onChange={(e)=>setManualCategory(e.target.value)} placeholder="Isi kategori aset" className="border p-2 rounded w-full" />
                )}
                {manualKind==='liabilitas' && (
                  <select value={manualCategory} onChange={(e)=>setManualCategory(e.target.value)} className="border p-2 rounded w-full">
                    {['Pinjaman Bank','Hutang Supplier','Hutang Sewa','Lainnya'].map(k=> <option key={k}>{k}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm">Sub-kategori (opsional)</label>
                <input value={manualSubCategory} onChange={(e)=>setManualSubCategory(e.target.value)} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="text-sm">Nominal</label>
                <input value={manualAmount} onChange={(e)=>{ const v = String(e.target.value).replace(/[^\d]/g,''); const f = v.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); setManualAmount(f) }} placeholder="contoh: 300.000.000" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="text-sm">Metode Pembayaran</label>
                <select value={manualMethod} onChange={(e)=>setManualMethod(e.target.value)} className="border p-2 rounded w-full">
                  <option>Cash</option>
                  <option>Transfer</option>
                  <option>Kredit</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Keterangan</label>
                <input value={manualDesc} onChange={(e)=>setManualDesc(e.target.value)} className="border p-2 rounded w-full" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={saveManualTx} className="px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }} title={editingManualId?'Simpan Perubahan':'Simpan'}>
                <img src="/images/save%20icon.svg" alt="Simpan" width="18" height="18" />
              </button>
              {editingManualId && (<button onClick={()=>{ setEditingManualId(null); setManualDate(''); setManualDesc(''); setManualAmount(''); setManualSubCategory('') }} className="px-4 py-2 rounded" style={{ background:'#e0e0e0' }}>Batal</button>)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">List Transaksi Manual</h2>
            <div className="space-y-2">
              {(transactions||[]).filter(t=>t.method!=='auto' && !t.salesOrderId).length===0 ? (
                <div className="text-sm text-gray-600">Belum ada transaksi manual.</div>
              ) : (
                (transactions||[]).filter(t=>t.method!=='auto' && !t.salesOrderId).map(t=> (
                  <div key={t.id} className="p-3 border rounded">
                    <div className="font-semibold">{t.description || '-'} <span className="text-sm text-gray-600">({t.date?.slice(0,10)})</span></div>
                    <div className="text-sm">Jenis: {t.kind || (t.type==='income'?'Pendapatan':'Beban')} | Kategori: {t.category || t.source || '-'} {t.subCategory?`/ ${t.subCategory}`:''} | Metode: {t.method || '-'}</div>
                    <div className="text-sm">Nominal: Rp. {(Number(t.amount)||0).toLocaleString('id-ID')}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={()=>{ setEditingManualId(t.id); setManualDate(t.date?.slice(0,10)||''); setManualDesc(t.description||''); setManualAmount(String(t.amount)); setManualKind(t.kind|| (t.type==='income'?'pendapatan':'beban')); setManualCategory(t.category||t.source||''); setManualSubCategory(t.subCategory||''); setManualMethod(t.method||'Cash') }} className="px-2 py-1 rounded text-white" style={{ background:'#1976d2' }}>Edit</button>
                      <button onClick={()=>{ setConfirmDeleteTxId(t.id); setConfirmDeleteTxDesc(t.description||'-') }} className="px-2 py-1 rounded text-white" style={{ background:'#d32f2f' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {active==='income_statement' && summary && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 rounded" style={{ background:'#e8f5e9' }}>
              <div className="text-sm text-gray-600">Pendapatan</div>
              <div className="text-2xl font-bold" style={{ color:'#2e7d32' }}>Rp {summary.incomeStatement.revenue.toLocaleString('id-ID')}</div>
              <div className="mt-3 bg-white p-3 rounded shadow">
                <div className="font-bold mb-2">Sumber Pendapatan</div>
                <canvas ref={revenuePieRef} width={300} height={160} className="w-full" />
                <div className="mt-2 text-xs text-gray-600">
                  <div>Pendapatan dihitung dari pesanan LUNAS: harga × kuantitas setiap item menu.</div>
                  <div>Jumlah kategori: {(summary.charts.pieRevenue||[]).length}</div>
                  <button onClick={()=>setShowRevenuePie(true)} className="mt-2 px-3 py-1 rounded text-white" style={{ background:'#2e7d32' }}>Lihat Pie Chart Lengkap</button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded" style={{ background:'#fff3e0' }}>
              <div className="text-sm text-gray-600">HPP</div>
              <div className="text-2xl font-bold" style={{ color:'#f57c00' }}>Rp {summary.incomeStatement.cogs.toLocaleString('id-ID')}</div>
              <div className="mt-3 bg-white p-3 rounded shadow">
                <div className="font-bold mb-2">Komposisi HPP</div>
                <canvas ref={cogsPieRef} width={300} height={160} className="w-full" />
                <div className="mt-2 text-xs text-gray-600">
                  <div>HPP dihitung dari pembelian bahan: total harga item yang dibeli.</div>
                  <div>Jumlah kategori: {(summary.charts.pieCogs||[]).length}</div>
                  <button onClick={()=>setShowCogsPie(true)} className="mt-2 px-3 py-1 rounded text-white" style={{ background:'#f57c00' }}>Lihat Pie Chart Lengkap</button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded" style={{ background:'#e3f2fd' }}>
              <div className="text-sm text-gray-600">Laba Bersih</div>
              <div className="text-2xl font-bold" style={{ color:'#1976d2' }}>Rp {summary.incomeStatement.netProfit.toLocaleString('id-ID')}</div>
              <div className="mt-3 bg-white p-3 rounded shadow">
                <div className="font-bold mb-2">Komposisi Laba/Rugi</div>
                <canvas ref={profitPieRef} width={300} height={160} className="w-full" />
                <div className="mt-2 text-xs text-gray-600">
                  <div>Laba Bersih = Pendapatan − HPP − Pengeluaran Operasional (transaksi manual beban).</div>
                  <button onClick={()=>setShowProfitPie(true)} className="mt-2 px-3 py-1 rounded text-white" style={{ background:'#1976d2' }}>Lihat Pie Chart Lengkap</button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {showRevenuePie && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowRevenuePie(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-[720px]" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Sumber Pendapatan (Lengkap)</div>
            <canvas ref={revenuePieFullRef} width={640} height={320} className="w-full" />
            <div className="mt-3 text-xs text-gray-700 max-h-56 overflow-auto">
              {(() => {
                const parts = (summary?.charts?.pieRevenue||[])
                const total = Math.max(1, parts.reduce((a,b)=>a + (Number(b.value)||0), 0))
                const cols = makeColors(parts.length)
                return parts.map((p,i)=>{
                  const clr = cols[i % cols.length]
                  const pct = (((Number(p.value)||0) / total) * 100).toFixed(1)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ width:12, height:12, backgroundColor: clr, display:'inline-block', borderRadius:2 }} />
                      <span>#{i+1} {p.label}: Rp {Number(p.value||0).toLocaleString('id-ID')} ({pct}%)</span>
                    </div>
                  )
                })
              })()}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowRevenuePie(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showCogsPie && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowCogsPie(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-[720px]" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Komposisi HPP (Lengkap)</div>
            <canvas ref={cogsPieFullRef} width={640} height={320} className="w-full" />
            <div className="mt-3 text-xs text-gray-700 max-h-56 overflow-auto">
              {(() => {
                const parts = (summary?.charts?.pieCogs||[])
                const total = Math.max(1, parts.reduce((a,b)=>a + (Number(b.value)||0), 0))
                const cols = makeColors(parts.length)
                return parts.map((p,i)=>{
                  const clr = cols[i % cols.length]
                  const pct = (((Number(p.value)||0) / total) * 100).toFixed(1)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ width:12, height:12, backgroundColor: clr, display:'inline-block', borderRadius:2 }} />
                      <span>#{i+1} {p.label}: Rp {Number(p.value||0).toLocaleString('id-ID')} ({pct}%)</span>
                    </div>
                  )
                })
              })()}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowCogsPie(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showProfitPie && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowProfitPie(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-[720px]" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Komposisi Laba/Rugi (Lengkap)</div>
            <canvas ref={profitPieFullRef} width={640} height={320} className="w-full" />
            <div className="mt-3 text-xs text-gray-700">
              {(() => {
                const parts = (summary?.charts?.pieProfit||[])
                const total = Math.max(1, parts.reduce((a,b)=>a + (Number(b.value)||0), 0))
                const cols = makeColors(parts.length)
                return parts.map((p,i)=>{
                  const clr = cols[i % cols.length]
                  const pct = (((Number(p.value)||0) / total) * 100).toFixed(1)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span style={{ width:12, height:12, backgroundColor: clr, display:'inline-block', borderRadius:2 }} />
                      <span>#{i+1} {p.label}: Rp {Number(p.value||0).toLocaleString('id-ID')} ({pct}%)</span>
                    </div>
                  )
                })
              })()}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowProfitPie(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {active==='search' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Cari & Filter Transaksi</h2>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <input placeholder="Kata kunci" value={q} onChange={(e)=>setQ(e.target.value)} className="border p-2 rounded" />
            <input placeholder="Minimal (Rp)" value={minAmt} onChange={(e)=>setMinAmt(e.target.value)} className="border p-2 rounded" />
            <input placeholder="Maksimal (Rp)" value={maxAmt} onChange={(e)=>setMaxAmt(e.target.value)} className="border p-2 rounded" />
          </div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {searchRows.map((t)=>(
              <div key={`${t.method}-${t.id}`} className="flex justify-between p-2 border rounded">
                <div>
                  <div className="text-sm">{new Date(t.date).toLocaleString('id-ID')}</div>
                  <div className="font-semibold">{t.type==='income'?'Income':'Expense'} • Rp {Number(t.amount).toLocaleString('id-ID')}</div>
                  <div className="text-xs text-gray-600">{t.source || '-'}{t.description?` • ${t.description}`:''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active==='aging' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">📋 Aging Piutang</h2>
          <div className="space-y-2">
            {agingRows.map((a,i)=>(
              <div key={i} className="flex justify-between p-2 border rounded">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-gray-600">{a.category} • {a.days} hari</div>
                </div>
                <div className="text-sm">Rp {a.amount.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      

      {active==='budgeting' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Anggaran</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm">Periode</label>
                <input type="month" value={budgetPeriod} onChange={(e)=>setBudgetPeriod(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Target Pendapatan</label>
                <input value={budgetIncome} onChange={(e)=>{ const v=String(e.target.value).replace(/[^\d]/g,''); const f=v.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); setBudgetIncome(f) }} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.keys(budgetPlan).map((k)=> (
                <div key={k}>
                  <label className="text-sm">{k}</label>
                  <input value={budgetPlan[k]} onChange={(e)=>{ const v=String(e.target.value).replace(/[^\d]/g,''); const f=v.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); setBudgetPlan(prev=>({ ...prev, [k]: f })) }} className="w-full border p-2 rounded" />
                </div>
              ))}
            </div>
            <button onClick={createBudget} className="mt-4 px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }} title="Simpan Anggaran">
              <img src="/images/add%20icon.svg" alt="Simpan Anggaran" width="18" height="18" />
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Daftar Anggaran</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {budgets.map((b,i)=> (
                <div key={b.noteId||i} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{b.period}</div>
                    <div className="text-sm">Pendapatan: Rp {Number(b.income_target||0).toLocaleString('id-ID')} • Pengeluaran: Rp {Number(b.total_expense_plan||0).toLocaleString('id-ID')}</div>
                    <div className="text-sm">Net Target: Rp {Number(b.net_target||0).toLocaleString('id-ID')}</div>
                    <div className="text-xs text-gray-600">Dibuat Oleh: {b.created_by_name || ((b.created_by_email===user?.email)?(user?.name||user?.fullName||user?.username): b.created_by_email) || '-'}</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={()=>{ setSelectedBudget(b); setActive('budgeting') }} className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" title="Pilih" style={{ background:'transparent' }}>
                      <img src="/images/choose.svg" alt="Pilih" className="w-6 h-6" />
                    </button>
                    {b.noteId && (
                      <button onClick={()=>{ setConfirmDeleteBudgetId(b.noteId); setConfirmDeleteBudgetPeriod(b.period) }} className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" title="Hapus" style={{ background:'transparent' }}>
                        <img src="/images/trash%20icon.svg" alt="Hapus" className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {budgets.length===0 && (<div className="text-sm text-gray-600">Belum ada anggaran.</div>)}
            </div>
          </div>
          {selectedBudget && (
            <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
              <h2 className="font-bold mb-4">Edit Anggaran • {selectedBudget.period}</h2>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-sm">Target Pendapatan</label>
                  <input value={selectedBudget.income_target} onChange={(e)=>setSelectedBudget(prev=>({ ...prev, income_target: e.target.value.replace(/[^\d]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.') }))} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="text-sm">Total Pengeluaran</label>
                  <input disabled value={Number(selectedBudget.total_expense_plan||0)} className="w-full border p-2 rounded bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm">Net Target</label>
                  <input disabled value={Number(selectedBudget.net_target||0)} className="w-full border p-2 rounded bg-gray-100" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(selectedBudget.expense_plan||{}).map(([k,v])=> (
                  <div key={k}>
                    <label className="text-sm">{k}</label>
                    <input value={v} onChange={(e)=>setSelectedBudget(prev=>({ ...prev, expense_plan: { ...(prev.expense_plan||{}), [k]: e.target.value.replace(/[^\d]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.') } }))} className="w-full border p-2 rounded" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveBudgetUpdate} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Simpan Perubahan</button>
                <button onClick={()=>setActive('budget_analysis')} className="px-4 py-2 rounded text-white" style={{ background:'#f57c00' }}>Lihat Analisis</button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDeleteBudgetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus anggaran <span className="font-semibold">{confirmDeleteBudgetPeriod}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteBudget} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDeleteBudget} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteTxId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus transaksi <span className="font-semibold">{confirmDeleteTxDesc}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteTx} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDeleteTx} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {showFinanceWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={()=>setShowFinanceWarning(false)}>
          <div className="bg-white rounded-lg shadow p-6 w-96" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">Peringatan</div>
            <div className="text-sm text-gray-700 mb-4">{financeWarningText}</div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowFinanceWarning(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {active==='forecast_edit' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">🔮 Proyeksi Arus Kas</h2>
            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-sm">Mulai Tanggal</label>
                <input type="date" value={forecastStartDate} onChange={(e)=>setForecastStartDate(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Jumlah Bulan</label>
                <input type="number" value={forecastMonths} onChange={(e)=>setForecastMonths(Number(e.target.value))} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Saldo Awal</label>
                <input type="number" value={forecastInitialBalance} onChange={(e)=>setForecastInitialBalance(e.target.value)} className="w-full border p-2 rounded" />
              </div>
            </div>
            <button onClick={createForecast} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Buat Proyeksi</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Daftar Proyeksi</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {forecasts.map((f,i)=> (
                <div key={f.noteId||i} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Mulai: {f.start_date}</div>
                    <div className="text-sm">Bulan: {f.months} • Saldo Awal: Rp {Number(f.initial_balance||0).toLocaleString('id-ID')}</div>
                  </div>
                  <button onClick={()=>{ setSelectedForecast(f); setSelectedForecastNoteId(f.noteId||null) }} className="px-3 py-1 rounded text-white" style={{ background:'#1976d2' }}>Pilih</button>
                </div>
              ))}
              {forecasts.length===0 && (<div className="text-sm text-gray-600">Belum ada proyeksi.</div>)}
            </div>
          </div>
          {selectedForecast && (
            <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
              <h2 className="font-bold mb-4">Edit Proyeksi • {selectedForecast.start_date}</h2>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr><th className="p-2 text-left">Bulan</th><th className="p-2 text-right">Pendapatan</th><th className="p-2 text-right">Pengeluaran</th><th className="p-2 text-right">Saldo Proyeksi</th></tr>
                  </thead>
                  <tbody>
                    {(selectedForecast.monthly_data||[]).map((m,i)=> (
                      <tr key={m.month} className="border-t">
                        <td className="p-2">{m.month}</td>
                        <td className="p-2 text-right">
                          <input type="number" value={m.projected_income} onChange={(e)=>setSelectedForecast(prev=>{ const md=[...(prev.monthly_data||[])]; md[i] = { ...md[i], projected_income: e.target.value }; return recalcForecastBalances({ ...prev, monthly_data: md }) })} className="w-40 border p-2 rounded" />
                        </td>
                        <td className="p-2 text-right">
                          <input type="number" value={m.projected_expenses} onChange={(e)=>setSelectedForecast(prev=>{ const md=[...(prev.monthly_data||[])]; md[i] = { ...md[i], projected_expenses: e.target.value }; return recalcForecastBalances({ ...prev, monthly_data: md }) })} className="w-40 border p-2 rounded" />
                        </td>
                        <td className="p-2 text-right">Rp {Number(m.projected_balance||0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button onClick={saveForecast} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Simpan Proyeksi</button>
              </div>
            </div>
          )}
        </div>
      )}

      {active==='budget_analysis' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">Analisis Anggaran</h2>
          {(() => {
            const data = computeBudgetAnalysis(selectedBudget)
            if (!selectedBudget) return <div className="text-sm text-gray-600">Pilih anggaran terlebih dahulu.</div>
            if (!data) return <div className="text-sm text-gray-600">Tidak ada data analisis.</div>
            return (
              <div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr><th className="p-2 text-left">Kategori</th><th className="p-2 text-right">Budget</th><th className="p-2 text-right">Actual</th><th className="p-2 text-right">Selisih</th><th className="p-2 text-right">%</th></tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r,i)=> (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.kategori}</td>
                          <td className="p-2 text-right">Rp {Number(r.budget||0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">Rp {Number(r.actual||0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">Rp {Number(r.variance||0).toLocaleString('id-ID')}</td>
                          <td className="p-2 text-right">{(Number(r.variancePct)||0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded" style={{ background:'#fff3e0' }}>
                    <div className="text-sm text-gray-600">Total Budget Pengeluaran</div>
                    <div className="text-2xl font-bold" style={{ color:'#f57c00' }}>Rp {Number(data.totals.total_budget_exp||0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="p-3 rounded" style={{ background:'#ffebee' }}>
                    <div className="text-sm text-gray-600">Total Actual Pengeluaran</div>
                    <div className="text-2xl font-bold" style={{ color:'#d32f2f' }}>Rp {Number(data.totals.total_actual_exp||0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="p-3 rounded" style={{ background:'#e8f5e9' }}>
                    <div className="text-sm text-gray-600">Selisih Pengeluaran</div>
                    <div className="text-2xl font-bold" style={{ color:'#2e7d32' }}>Rp {Number(data.totals.total_variance_exp||0).toLocaleString('id-ID')} ({(Number(data.totals.total_variance_pct_exp)||0).toFixed(1)}%)</div>
                  </div>
                  <div className="p-3 rounded" style={{ background:'#e3f2fd' }}>
                    <div className="text-sm text-gray-600">Laba/Rugi vs Target</div>
                    <div className="text-2xl font-bold" style={{ color:'#1976d2' }}>Rp {Number(data.totals.net_variance||0).toLocaleString('id-ID')} ({(Number(data.totals.net_variance_pct)||0).toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      
    </Layout>
  )

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>💰 Finance</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTab('kelola')} className={`px-4 py-2 rounded ${tab === 'kelola' ? 'text-white' : 'bg-white'}`} style={{ background: tab === 'kelola' ? '#2e7d32' : '#e0e0e0' }}>
          📝 Kelola Transaksi
        </button>
        <button onClick={() => setTab('visualisasi')} className={`px-4 py-2 rounded ${tab === 'visualisasi' ? 'text-white' : 'bg-white'}`} style={{ background: tab === 'visualisasi' ? '#2e7d32' : '#e0e0e0' }}>
          📈 Visualisasi Data
        </button>
        <button onClick={() => setTab('export')} className={`px-4 py-2 rounded ${tab === 'export' ? 'text-white' : 'bg-white'}`} style={{ background: tab === 'export' ? '#2e7d32' : '#e0e0e0' }}>
          📑 Export Laporan
        </button>
      </div>

      {tab === 'forecast' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Pendapatan Harian (Historis)</h2>
            <canvas ref={historyChartRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Forecast {forecast.forecast.length} Hari Ke Depan</h2>
            <canvas ref={forecastChartRef} width={600} height={200} className="w-full" />
          </div>
        </div>
      )}

      {tab === 'kelola' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Input Transaksi Manual</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Jenis</label>
                <select value={manualType} onChange={(e)=>setManualType(e.target.value)} className="w-full border p-2 rounded">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Tanggal</label>
                <input type="date" value={manualDate} onChange={(e)=>setManualDate(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Jumlah</label>
                <input placeholder="contoh: 300.000.000" value={manualAmount} onChange={(e)=>{ const v = String(e.target.value).replace(/[^\d]/g,''); const f = v.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); setManualAmount(f) }} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Kategori/Sumber</label>
                <input value={manualSource} onChange={(e)=>setManualSource(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Deskripsi</label>
                <input value={manualDesc} onChange={(e)=>setManualDesc(e.target.value)} className="w-full border p-2 rounded" />
              </div>
            </div>
            <button onClick={saveManualSimple} className="mt-4 px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }} title="Simpan">
              <img src="/images/save%20icon.svg" alt="Simpan" width="18" height="18" />
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-4">Daftar Transaksi (Manual + Otomatis)</h2>
            <div className="flex gap-2 mb-3">
              <input type="date" value={rangeFrom} onChange={(e)=>setRangeFrom(e.target.value)} className="border p-2 rounded" />
              <input type="date" value={rangeTo} onChange={(e)=>setRangeTo(e.target.value)} className="border p-2 rounded" />
              <button onClick={loadAll} className="px-3 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Filter</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {transactions.map((t)=> (
                <div key={`${t.method}-${t.id}`} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="text-sm">{new Date(t.date).toLocaleString('id-ID')}</div>
                    <div className="font-semibold">{t.type === 'income' ? 'Income' : 'Expense'} • Rp {Number(t.amount).toLocaleString('id-ID')}</div>
                    <div className="text-xs text-gray-600">{t.source || '-'}{t.description?` • ${t.description}`:''}</div>
                  </div>
                  {t.method === 'manual' && (
                    <button onClick={()=>{ setConfirmDeleteTxId(t.id); setConfirmDeleteTxDesc(t.description||'-') }} className="px-2 py-1 text-white rounded" style={{ background:'#d32f2f' }}>Hapus</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="font-bold mb-4">🍵 Hitung HPP Menu Baru</h2>
            <form onSubmit={(e)=>{ e.preventDefault(); const parts = hppInputs.split(',').map(v=>parseFloat(v.trim())||0); const total = parts.reduce((a,b)=>a+b,0); setHppResult(((total/(hppServings||1))||0).toFixed(2)) }} className="max-w-xl">
              <label className="block mb-2 text-sm">Biaya bahan per porsi (pisahkan dengan koma)</label>
              <input value={hppInputs} onChange={(e)=>setHppInputs(e.target.value)} className="w-full border p-2 mb-3 rounded" placeholder="e.g. 2000,500,300" />
              <label className="block mb-2 text-sm">Jumlah porsi</label>
              <input type="number" value={hppServings} onChange={(e)=>setHppServings(Number(e.target.value))} className="w-full border p-2 mb-4 rounded" />
              <button type="submit" className="w-full py-2 rounded text-white" style={{ background:'#2e7d32' }}>Hitung HPP</button>
            </form>
            {hppResult && (
              <div className="mt-4 p-4 rounded inline-block" style={{ background:'#e8f5e9' }}>
                <div className="text-sm text-gray-600">HPP Per Porsi</div>
                <div className="text-3xl font-bold" style={{ color:'#2e7d32' }}>Rp {parseInt(hppResult).toLocaleString('id-ID')}</div>
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="font-bold mb-2">📄 Data Menu</h2>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr><th className="text-left p-2">Menu</th><th className="text-left p-2">Harga</th><th className="text-left p-2">Bahan</th></tr>
                </thead>
                <tbody>
                  {salesProducts.map(p=> (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                      <td className="p-2">{Array.isArray(p.ingredients)?p.ingredients.map(i=>`${i.qty} ${i.unit} ${i.name}`).join(', '):'-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'visualisasi' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">📊 Pendapatan per Hari</h2>
            <canvas ref={vizIncomeRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">💸 Pengeluaran per Hari</h2>
            <canvas ref={vizExpenseRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">📈 Tren Penjualan Harian</h2>
            <canvas ref={vizDailyRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">🍵 Performa Menu (Top 8 Revenue)</h2>
            <canvas ref={vizMenuRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">📦 Stok vs Minimal</h2>
            <canvas ref={vizStockRef} width={600} height={200} className="w-full" />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2 max-w-xl">
            <h2 className="font-bold mb-4">⚖️ Analisis BEP</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Biaya Tetap (Fixed Cost)</label>
                <input type="number" value={bepFixed} onChange={(e)=>setBepFixed(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm">Biaya Variabel per Unit</label>
                <input type="number" value={bepVarPerUnit} onChange={(e)=>setBepVarPerUnit(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Harga Jual per Unit</label>
                <div className="flex gap-2">
                  <input type="number" value={bepPrice} onChange={(e)=>setBepPrice(e.target.value)} className="flex-1 border p-2 rounded" />
                  <select onChange={(e)=>{ const found = salesProducts.find(p=>p.id===Number(e.target.value)); if (found) setBepPrice(String(found.price||0)) }} className="border p-2 rounded">
                    <option value="">Pilih dari Produk</option>
                    {salesProducts.map(p=> <option key={p.id} value={p.id}>{p.name} • Rp {Number(p.price).toLocaleString('id-ID')}</option> )}
                  </select>
                </div>
              </div>
            </div>
            <button onClick={()=>{ const fc = Number(bepFixed)||0; const vc = Number(bepVarPerUnit)||0; const price = Number(bepPrice)||0; const units = price>vc ? Math.ceil(fc / (price - vc)) : 0; setBepUnits(units) }} className="mt-4 w-full py-2 rounded text-white" style={{ background:'#2e7d32' }}>Hitung BEP</button>
            {bepUnits!=null && (
              <div className="mt-4 p-4 rounded" style={{ background:'#e8f5e9' }}>
                <div className="text-sm text-gray-600">BEP (Unit)</div>
                <div className="text-3xl font-bold" style={{ color:'#2e7d32' }}>{bepUnits} Unit</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
          <h2 className="font-bold mb-4">📑 Export Laporan</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={()=>{
              const rows = transactions.map(t=>({ tanggal: new Date(t.date).toLocaleDateString('id-ID'), jenis: t.type, jumlah: t.amount, sumber: t.source||'', deskripsi: t.description||'' }))
              const header = 'Tanggal;Jenis;Jumlah;Sumber;Deskripsi\n'
              const body = rows.map(r=>`${r.tanggal};${r.jenis};${r.jumlah};${r.sumber};${r.deskripsi}`).join('\n')
              const blob = new Blob([header+body], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'transaksi.csv'
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Export Transaksi (CSV)</button>
            <button onClick={()=>{
              const rows = salesProducts.map(p=>({ menu: p.name, harga: Number(p.price)||0, bahan: (Array.isArray(p.ingredients)?p.ingredients.map(i=>`${i.qty} ${i.unit} ${i.name}`).join(', '):'') }))
              const header = 'Menu;Harga;Bahan\n'
              const body = rows.map(r=>`${r.menu};${r.harga};${r.bahan}`).join('\n')
              const blob = new Blob([header+body], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'menu.csv'
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }} className="px-4 py-2 rounded text-white" style={{ background:'#2e7d32' }}>Export Menu (CSV)</button>
            <button onClick={async()=>{
              const res = await fetch('/api/reports/generate')
              if (!res.ok) return alert('Gagal generate PDF (butuh akses admin)')
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'Laporan_Machazen.pdf'
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }} className="px-4 py-2 rounded text-white" style={{ background:'#1976d2' }}>Export PDF (Grafik)</button>
            <button onClick={()=>{
              const payload = { transaksi: transactions, menu: salesProducts, stok: stocksData }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'backup_data.json'
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }} className="px-4 py-2 rounded text-white" style={{ background:'#f57c00' }}>Export Data (JSON)</button>
          </div>
        </div>
      )}

      {tab === 'bep' && (
        <div className="bg-white p-6 rounded-lg shadow max-w-xl">
          <h2 className="font-bold mb-4">Break Even Point (BEP)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Biaya Tetap (Fixed Cost)</label>
              <input type="number" value={bepFixed} onChange={(e)=>setBepFixed(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="text-sm">Biaya Variabel per Unit</label>
              <input type="number" value={bepVarPerUnit} onChange={(e)=>setBepVarPerUnit(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Harga Jual per Unit</label>
              <div className="flex gap-2">
                <input type="number" value={bepPrice} onChange={(e)=>setBepPrice(e.target.value)} className="flex-1 border p-2 rounded" />
                <select onChange={(e)=>{ const found = salesProducts.find(p=>p.id===Number(e.target.value)); if (found) setBepPrice(String(found.price||0)) }} className="border p-2 rounded">
                  <option value="">Pilih dari Produk</option>
                  {salesProducts.map(p=> <option key={p.id} value={p.id}>{p.name} • Rp {Number(p.price).toLocaleString('id-ID')}</option> )}
                </select>
              </div>
            </div>
          </div>
          <button onClick={()=>{ const fc = Number(bepFixed)||0; const vc = Number(bepVarPerUnit)||0; const price = Number(bepPrice)||0; const units = price>vc ? Math.ceil(fc / (price - vc)) : 0; setBepUnits(units) }} className="mt-4 w-full py-2 rounded text-white" style={{ background:'#2e7d32' }}>Hitung BEP</button>
          {bepUnits!=null && (
            <div className="mt-4 p-4 rounded" style={{ background:'#e8f5e9' }}>
              <div className="text-sm text-gray-600">BEP (Unit)</div>
              <div className="text-3xl font-bold" style={{ color:'#2e7d32' }}>{bepUnits} Unit</div>
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && summary && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Laporan Laba/Rugi</h2>
            <div className="space-y-2 p-4 rounded" style={{ background:'#f5f5f5' }}>
              <div className="flex justify-between"><span>Total Penjualan</span><span className="font-bold">Rp {summary.incomeStatement.revenue.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>COGS</span><span className="font-bold">Rp {summary.incomeStatement.cogs.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Laba Kotor</span><span className="font-bold">Rp {summary.incomeStatement.grossProfit.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span>Pengeluaran Operasional</span><span className="font-bold">Rp {summary.incomeStatement.operatingExpenses.toLocaleString('id-ID')}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between" style={{ color: summary.incomeStatement.netProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
                <span className="font-bold">Laba/Rugi Bersih</span>
                <span className="font-bold text-lg">Rp {summary.incomeStatement.netProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <h3 className="mt-4 font-bold">Pendapatan Bulanan</h3>
            <canvas ref={monthlyChartRef} width={600} height={200} className="w-full" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold mb-2">Arus Kas</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded" style={{ background:'#e8f5e9' }}>
                <div className="text-sm text-gray-600">Kas Masuk</div>
                <div className="text-2xl font-bold" style={{ color:'#2e7d32' }}>Rp {summary.cashFlow.inflow.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3 rounded" style={{ background:'#ffebee' }}>
                <div className="text-sm text-gray-600">Kas Keluar</div>
                <div className="text-2xl font-bold" style={{ color:'#d32f2f' }}>Rp {summary.cashFlow.outflow.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3 rounded" style={{ background:'#e3f2fd' }}>
                <div className="text-sm text-gray-600">Net Cash</div>
                <div className="text-2xl font-bold" style={{ color:'#1976d2' }}>Rp {summary.cashFlow.netCash.toLocaleString('id-ID')}</div>
              </div>
            </div>
            
          </div>
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="font-bold mb-2">Neraca Sederhana</h2>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="p-3 rounded" style={{ background:'#e8f5e9' }}>
                <div className="text-sm text-gray-600">Aktiva (Assets)</div>
                <div className="text-2xl font-bold" style={{ color:'#2e7d32' }}>Rp {summary.balanceSheet.assets.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3 rounded" style={{ background:'#e8f5e9' }}>
                <div className="text-sm text-gray-600">Kas</div>
                <div className="text-2xl font-bold" style={{ color:'#2e7d32' }}>Rp {summary.balanceSheet.cash.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3 rounded" style={{ background:'#fff3e0' }}>
                <div className="text-sm text-gray-600">Piutang</div>
                <div className="text-2xl font-bold" style={{ color:'#f57c00' }}>Rp {summary.balanceSheet.receivables.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3 rounded" style={{ background:'#e3f2fd' }}>
                <div className="text-sm text-gray-600">Ekuitas</div>
                <div className="text-2xl font-bold" style={{ color:'#1976d2' }}>Rp {summary.balanceSheet.equity.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
