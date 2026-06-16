const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const orders = await prisma.purchaseOrder.findMany({ orderBy: { id: 'desc' }, take: 100 })
    const enriched = await Promise.all(orders.map(async (o) => {
      const items = await prisma.purchaseItem.findMany({ where: { orderId: o.id } })
      const creator = o.userId ? await prisma.user.findUnique({ where: { id: o.userId } }) : null
      return { id: o.id, place: o.place || '-', createdAt: o.createdAt, createdByEmail: creator?.email || null, items }
    }))
    return res.json(enriched)
  }

  if (req.method === 'POST') {
    const { place, items = [], createdAt } = req.body || {}
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items required' })
    const order = await prisma.purchaseOrder.create({ data: { place: place || '-', userId: user.userId, createdAt: createdAt ? new Date(createdAt) : undefined } })
    for (const it of items) {
      const totalPrice = (Number(it.pricePerItem) || 0) * (Number(it.qtyItems) || 0)
      await prisma.purchaseItem.create({
        data: {
          orderId: order.id,
          name: String(it.name || ''),
          unit: String(it.unit || '') || null,
          qtyItems: Number(it.qtyItems) || 0,
          net: Number(it.net) || 0,
          pricePerItem: Number(it.pricePerItem) || 0,
          totalPrice,
        },
      })
    }
    const createdItems = await prisma.purchaseItem.findMany({ where: { orderId: order.id } })
    const orderCount = await prisma.purchaseOrder.count()
    if (orderCount > 100) {
      const oldest = await prisma.purchaseOrder.findFirst({ orderBy: { createdAt: 'asc' } })
      if (oldest) {
        await prisma.purchaseItem.deleteMany({ where: { orderId: oldest.id } })
        await prisma.purchaseOrder.delete({ where: { id: oldest.id } })
      }
    }
    return res.json({ id: order.id, place: order.place || '-', createdAt: order.createdAt, createdByEmail: user.email, items: createdItems })
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || {}
      const orderId = Number(id)
      if (!orderId) return res.status(400).json({ error: 'id required' })
      await prisma.purchaseItem.deleteMany({ where: { orderId } })
      await prisma.purchaseOrder.delete({ where: { id: orderId } })
      return res.json({ success: true })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete purchase order' })
    }
  }

  res.status(405).end()
}
