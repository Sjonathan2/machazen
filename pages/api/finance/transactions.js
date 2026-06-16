const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

function toISODate(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate())
}

async function getManualTransactions(userId, from, to) {
  const notes = await prisma.note.findMany({ where: { authorId: userId, title: 'FINANCE_TX' }, orderBy: { id: 'desc' } })
  const res = []
  for (const n of notes) {
    try {
      const data = JSON.parse(n.content || '{}')
      const dt = new Date(data.date || n.createdAt)
      if (from && dt < toISODate(from)) continue
      if (to && dt > toISODate(to)) continue
      res.push({ id: n.id, method: 'manual', type: data.type || 'expense', kind: data.kind || null, amount: Number(data.amount) || 0, date: dt.toISOString(), description: data.description || '', source: data.source || '', category: data.category || null, subCategory: data.subCategory || null, method: data.method || null, salesOrderId: data.salesOrderId || null })
    } catch {}
  }
  return res
}

async function getAutoTransactions(userId, from, to) {
  const res = []
  const sales = await prisma.salesOrder.findMany({ where: {}, orderBy: { id: 'desc' } })
  for (const s of sales) {
    const dt = new Date(s.createdAt)
    if (from && dt < toISODate(from)) continue
    if (to && dt > toISODate(to)) continue
    if (s.paid) {
      res.push({ id: `sales-${s.id}`, method: 'auto', type: 'income', amount: Number(s.total) || 0, date: dt.toISOString(), description: 'Penjualan', source: 'cash' })
    }
  }
  const purchaseOrders = await prisma.purchaseOrder.findMany({ orderBy: { id: 'desc' } })
  for (const po of purchaseOrders) {
    const items = await prisma.purchaseItem.findMany({ where: { orderId: po.id } })
    const sum = items.reduce((a, b) => a + (Number(b.totalPrice) || 0), 0)
    const dt = new Date(po.createdAt)
    if (from && dt < toISODate(from)) continue
    if (to && dt > toISODate(to)) continue
    res.push({ id: `purchase-${po.id}`, method: 'auto', type: 'expense', amount: sum, date: dt.toISOString(), description: 'Pembelian', source: 'inventory' })
  }
  return res
}

export default async function handler(req, res) {
  const auth = getAuthFromCookie(req)
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const userId = auth.userId

  if (req.method === 'GET') {
    const { from, to, includeAuto } = req.query
    const manual = await getManualTransactions(userId, from, to)
    if (includeAuto === 'true') {
      const auto = await getAutoTransactions(userId, from, to)
      return res.json([...manual, ...auto])
    }
    return res.json(manual)
  }

  if (req.method === 'POST') {
    const { type, amount, date, description, source, category, subCategory, method, kind } = req.body || {}
    if (!type || typeof amount !== 'number') return res.status(400).json({ error: 'type and amount required' })
    const payload = { type, kind: kind || null, amount, date: date || new Date().toISOString(), description: description || '', source: source || '', category: category || null, subCategory: subCategory || null, method: method || null }
    const note = await prisma.note.create({ data: { title: 'FINANCE_TX', content: JSON.stringify(payload), authorId: userId } })
    return res.json({ id: note.id, method: 'manual', ...payload })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const noteId = Number(id)
    if (!noteId) return res.status(400).json({ error: 'Invalid id' })
    await prisma.note.delete({ where: { id: noteId } })
    return res.json({ success: true })
  }

  if (req.method === 'PUT') {
    const { id } = req.query
    const noteId = Number(id)
    if (!noteId) return res.status(400).json({ error: 'Invalid id' })
    const { type, amount, date, description, source, category, subCategory, method, kind } = req.body || {}
    if (!type || typeof amount !== 'number') return res.status(400).json({ error: 'type and amount required' })
    const payload = { type, kind: kind || null, amount, date: date || new Date().toISOString(), description: description || '', source: source || '', category: category || null, subCategory: subCategory || null, method: method || null }
    const note = await prisma.note.update({ where: { id: noteId }, data: { content: JSON.stringify(payload) } })
    return res.json({ id: note.id, method: 'manual', ...payload })
  }

  res.status(405).end()
}
