const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

function startOfDay(d) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()) }
function endOfDay(d) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999) }

async function getManualTransactions(userId, from, to) {
  const notes = await prisma.note.findMany({ where: { authorId: userId, title: 'FINANCE_TX' }, orderBy: { id: 'desc' } })
  const res = []
  for (const n of notes) {
    try {
      const data = JSON.parse(n.content || '{}')
      const dt = new Date(data.date || n.createdAt)
      if (from && dt < startOfDay(from)) continue
      if (to && dt > endOfDay(to)) continue
      res.push({ type: data.type || 'expense', amount: Number(data.amount) || 0, date: dt, source: data.source || '' })
    } catch {}
  }
  return res
}

export default async function handler(req, res) {
  const auth = getAuthFromCookie(req)
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const { from, to } = req.query

  const sales = await prisma.salesOrder.findMany({ where: {}, orderBy: { createdAt: 'asc' } })
  const purchases = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'asc' } })
  const manual = await getManualTransactions(auth.userId, from, to)

  let revenueTotal = 0
  let revenuePaid = 0
  let cogs = 0
  let operatingExpenses = 0
  let inflow = 0
  let outflow = 0

  for (const s of sales) {
    const dt = new Date(s.createdAt)
    if (from && dt < startOfDay(from)) continue
    if (to && dt > endOfDay(to)) continue
    revenueTotal += Number(s.total) || 0
    if (s.paid) revenuePaid += Number(s.total) || 0
  }
  for (const po of purchases) {
    const dt = new Date(po.createdAt)
    if (from && dt < startOfDay(from)) continue
    if (to && dt > endOfDay(to)) continue
    const items = await prisma.purchaseItem.findMany({ where: { orderId: po.id } })
    const sum = items.reduce((a, b) => a + (Number(b.totalPrice) || 0), 0)
    cogs += sum
  }
  for (const m of manual) {
    if (m.type === 'expense') operatingExpenses += m.amount
    if (m.type === 'income') inflow += m.amount
    if (m.type === 'expense') outflow += m.amount
  }
  inflow += revenuePaid
  outflow += cogs

  const revenue = revenuePaid
  const grossProfit = revenue - cogs
  const netProfit = grossProfit - operatingExpenses

  const receivables = revenueTotal - revenuePaid
  const cash = inflow - outflow
  const assets = cash + receivables
  const liabilities = 0
  const equity = assets - liabilities

  const daily = {}
  for (const s of sales) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    daily[key] = (daily[key] || 0) + (Number(s.total) || 0)
  }
  const timeSeriesRevenueDaily = Object.entries(daily).map(([date, value]) => ({ date, value })).sort((a,b)=>a.date.localeCompare(b.date))

  const months = {}
  for (const s of sales) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    months[key] = (months[key] || 0) + (Number(s.total) || 0)
  }
  const revenueMonthly = Object.entries(months).map(([month, value]) => ({ month, value })).sort((a,b)=>a.month.localeCompare(b.month))

  const expenseBreakdown = {}
  for (const m of manual) {
    if (m.type !== 'expense') continue
    const key = m.source || 'lainnya'
    expenseBreakdown[key] = (expenseBreakdown[key] || 0) + m.amount
  }
  const pieExpenses = Object.entries(expenseBreakdown).map(([label, value]) => ({ label, value }))

  const revenueBreakdown = {}
  for (const s of sales) {
    const dt = new Date(s.createdAt)
    if (from && dt < startOfDay(from)) continue
    if (to && dt > endOfDay(to)) continue
    if (!s.paid) continue
    const items = await prisma.salesOrderItem.findMany({ where: { orderId: s.id } })
    for (const it of items) {
      const name = it.name || 'lainnya'
      const val = (Number(it.price) || 0) * (Number(it.quantity) || 0)
      revenueBreakdown[name] = (revenueBreakdown[name] || 0) + val
    }
  }
  const pieRevenue = Object.entries(revenueBreakdown).map(([label, value]) => ({ label, value }))

  const cogsBreakdown = {}
  for (const po of purchases) {
    const dt = new Date(po.createdAt)
    if (from && dt < startOfDay(from)) continue
    if (to && dt > endOfDay(to)) continue
    const items = await prisma.purchaseItem.findMany({ where: { orderId: po.id } })
    for (const it of items) {
      const name = it.name || 'lainnya'
      const val = Number(it.totalPrice) || 0
      cogsBreakdown[name] = (cogsBreakdown[name] || 0) + val
    }
  }
  const pieCogs = Object.entries(cogsBreakdown).map(([label, value]) => ({ label, value }))

  const pieProfit = [
    { label: 'Pendapatan', value: Math.max(0, revenue) },
    { label: 'HPP', value: Math.max(0, cogs) },
    { label: 'Pengeluaran Operasional', value: Math.max(0, operatingExpenses) }
  ]

  res.json({
    incomeStatement: { revenue, cogs, grossProfit, operatingExpenses, netProfit },
    cashFlow: { inflow, outflow, netCash: inflow - outflow },
    balanceSheet: { assets, cash, receivables, liabilities, equity },
    charts: { timeSeriesRevenueDaily, revenueMonthly, pieExpenses, pieRevenue, pieCogs, pieProfit },
  })
}
