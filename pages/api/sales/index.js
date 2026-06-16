const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const orders = await prisma.salesOrder.findMany({ orderBy: { id: 'desc' }, take: 100 })
    const enriched = await Promise.all(orders.map(async (o) => {
      const items = await prisma.salesOrderItem.findMany({ where: { orderId: o.id } })
      const creator = o.userId ? await prisma.user.findUnique({ where: { id: o.userId } }) : null
      return { id: o.id, customerName: o.customerName || '-', total: o.total || 0, paid: !!o.paid, createdAt: o.createdAt, createdByEmail: creator?.email || null, items }
    }))
    return res.json(enriched)
  }

  if (req.method === 'POST') {
    const { customerName, items = [] } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items required' })

    function normalizeUnit(u) {
      const m = { gram: 'gram', kilogram: 'kilogram', mililiter: 'mililiter', liter: 'liter', pieces: 'pieces', g: 'gram', kg: 'kilogram', ml: 'mililiter', l: 'liter' }
      return m[String(u || '').toLowerCase()] || String(u || '').toLowerCase()
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

    const insufficient = []
    for (const it of items) {
      const recipeId = it.productId ? Number(it.productId) : null
      if (!recipeId) continue
      const ings = await prisma.recipeIngredient.findMany({ where: { recipeId } })
      for (const ing of ings) {
        const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
        if (!stock) continue
        const requiredBase = Number(ing.quantity) * (Number(it.quantity) || 0)
        const requiredInStockUnit = convert(requiredBase, ing.unit || stock.unit, stock.unit)
        const available = Number(stock.quantity) || 0
        if (available < requiredInStockUnit) {
          insufficient.push({ productName: String(it.name || ''), stockName: stock.name, unit: stock.unit, required: requiredInStockUnit, available })
        }
      }
    }
    if (insufficient.length > 0) {
      return res.status(400).json({ error: 'Insufficient stock', insufficient })
    }

    const total = items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 0)), 0)
    const order = await prisma.salesOrder.create({ data: { customerName: customerName || '-', total, paid: false, userId: user.userId } })
    for (const it of items) {
      await prisma.salesOrderItem.create({
        data: {
          orderId: order.id,
          recipeId: it.productId ? Number(it.productId) : null,
          name: String(it.name || ''),
          unit: String(it.unit || '') || null,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 0,
        },
      })
    }
    const createdItems = await prisma.salesOrderItem.findMany({ where: { orderId: order.id } })

    const totalQty = createdItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    const metricNotes = await prisma.note.findMany({ where: { title: 'METRIC_TOTAL_PRODUCTS_SOLD' }, orderBy: { id: 'desc' } })
    if (metricNotes.length === 0) {
      await prisma.note.create({ data: { title: 'METRIC_TOTAL_PRODUCTS_SOLD', content: String(totalQty), authorId: user.userId } })
    } else {
      const current = Number(metricNotes[0].content || '0') || 0
      await prisma.note.update({ where: { id: metricNotes[0].id }, data: { content: String(current + totalQty) } })
    }

    const orderCount = await prisma.salesOrder.count()
    if (orderCount > 100) {
      const oldest = await prisma.salesOrder.findFirst({ orderBy: { createdAt: 'asc' } })
      if (oldest) {
        await prisma.salesOrderItem.deleteMany({ where: { orderId: oldest.id } })
        await prisma.salesOrder.delete({ where: { id: oldest.id } })
      }
    }

    return res.json({ id: order.id, customerName: order.customerName || '-', total: order.total || 0, paid: !!order.paid, createdAt: order.createdAt, createdByEmail: user.email, items: createdItems })
  }

  res.status(405).end()
}
