const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const logs = await prisma.stockLog.findMany({
      where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const enriched = await Promise.all(logs.map(async (log) => {
      const stock = await prisma.stock.findUnique({ where: { id: log.stockId } })
      return { ...log, unit: stock?.unit || '' }
    }))
    return res.json(enriched)
  }

  if (req.method === 'DELETE') {
    await prisma.stockLog.deleteMany({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } } })
    return res.json({ ok: true })
  }

  return res.status(405).end()
}
