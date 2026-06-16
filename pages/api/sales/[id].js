const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const orderId = Number(id)
  if (!orderId) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const order = await prisma.salesOrder.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json({ error: 'Not found' })
    const items = await prisma.salesOrderItem.findMany({ where: { orderId } })
    const creator = order.userId ? await prisma.user.findUnique({ where: { id: order.userId } }) : null
    return res.json({ id: order.id, customerName: order.customerName || '-', total: order.total || 0, paid: !!order.paid, createdAt: order.createdAt, createdByEmail: creator?.email || null, items })
  }

  if (req.method === 'PATCH') {
    const { paid, paymentMethod } = req.body || {}
    const updated = await prisma.salesOrder.update({ where: { id: orderId }, data: { paid: !!paid } })
    const items = await prisma.salesOrderItem.findMany({ where: { orderId } })

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

    if (paid === true) {
      for (const it of items) {
        const ings = await prisma.recipeIngredient.findMany({ where: { recipeId: it.recipeId || 0 } })
        for (const ing of ings) {
          const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
          if (!stock) continue
          const requiredBase = Number(ing.quantity) * (Number(it.quantity) || 0)
          const requiredInStockUnit = convert(requiredBase, ing.unit || stock.unit, stock.unit)
          await prisma.stock.update({ where: { id: stock.id }, data: { quantity: Math.max(0, (Number(stock.quantity) || 0) - requiredInStockUnit) } })
        }
      }
      const payload = { type: 'income', kind: 'pendapatan', amount: Number(updated.total)||0, date: new Date().toISOString(), description: `Pembayaran Pesanan #${updated.id}`, source: 'sales', category: 'Penjualan Barang', subCategory: null, method: paymentMethod || null, salesOrderId: updated.id }
      await prisma.note.create({ data: { title: 'FINANCE_TX', content: JSON.stringify(payload), authorId: user.userId } })
    } else if (paid === false) {
      for (const it of items) {
        const ings = await prisma.recipeIngredient.findMany({ where: { recipeId: it.recipeId || 0 } })
        for (const ing of ings) {
          const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
          if (!stock) continue
          const requiredBase = Number(ing.quantity) * (Number(it.quantity) || 0)
          const requiredInStockUnit = convert(requiredBase, ing.unit || stock.unit, stock.unit)
          await prisma.stock.update({ where: { id: stock.id }, data: { quantity: (Number(stock.quantity) || 0) + requiredInStockUnit } })
        }
      }
      const notes = await prisma.note.findMany({ where: { authorId: user.userId, title: 'FINANCE_TX' }, orderBy: { id: 'desc' } })
      for (const n of notes) {
        try {
          const obj = JSON.parse(n.content || '{}')
          if (obj.salesOrderId === updated.id) {
            await prisma.note.delete({ where: { id: n.id } })
            break
          }
        } catch {}
      }
    }

    const creator = updated.userId ? await prisma.user.findUnique({ where: { id: updated.userId } }) : null
    return res.json({ id: updated.id, customerName: updated.customerName || '-', total: updated.total || 0, paid: !!updated.paid, createdAt: updated.createdAt, createdByEmail: creator?.email || null, items })
  }

  if (req.method === 'DELETE') {
    await prisma.salesOrderItem.deleteMany({ where: { orderId } })
    await prisma.salesOrder.delete({ where: { id: orderId } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
