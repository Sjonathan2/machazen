const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const stocks = await prisma.stock.findMany({ orderBy: { id: 'desc' }, take: 100 })
    return res.json(stocks)
  }

  if (req.method === 'POST') {
    const { name, unit, quantity, minLevel } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const allowed = ['kilogram', 'liter', 'mililiter', 'pieces', 'gram']
    const map = { ml: 'mililiter', g: 'gram' }
    const nu = (map[(unit || '').toLowerCase()] || (unit || '').toLowerCase())
    if (!allowed.includes(nu)) return res.status(400).json({ error: 'Invalid unit' })
    const s = await prisma.stock.create({ data: { name, unit: nu, quantity: Number(quantity), minLevel: Number(minLevel) || 0 } })
    const NAME_MAP = {
      'kent@machazen.id': 'Kent Susanto',
      'bukanalden@gmail.com': 'Joshua Alden',
      'jersy_istri@zhongli.com': 'Jersy Liora',
      'leenciaaa@gmail.com': 'Patricia Aileen',
      'lauren@machazen.id': 'Laurencia Aurelia Calysta',
    }
    const fullName = NAME_MAP[user.email] || user.email
    const note = `Penambahan Stock (${name}) Telah Ditambahkan Oleh (${fullName})`
    const countLogs = await prisma.stockLog.count({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } } })
    if (countLogs >= 100) {
      const oldest = await prisma.stockLog.findFirst({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } }, orderBy: { createdAt: 'asc' } })
      if (oldest) await prisma.stockLog.delete({ where: { id: oldest.id } })
    }
    await prisma.stockLog.create({ data: { stockId: s.id, action: 'create', quantity: Number(quantity), userId: user.userId, note } })
    const countStocks = await prisma.stock.count()
    if (countStocks > 100) {
      const oldestStock = await prisma.stock.findFirst({ orderBy: { createdAt: 'asc' } })
      if (oldestStock) await prisma.stock.delete({ where: { id: oldestStock.id } })
    }
    return res.json(s)
  }

  if (req.method === 'PUT') {
    const { id, name, unit, quantity, minLevel } = req.body
    const old = await prisma.stock.findUnique({ where: { id: Number(id) } })
    const allowed = ['kilogram', 'liter', 'mililiter', 'pieces', 'gram']
    const map = { ml: 'mililiter', g: 'gram' }
    const nu = (map[(unit || '').toLowerCase()] || (unit || '').toLowerCase())
    if (!allowed.includes(nu)) return res.status(400).json({ error: 'Invalid unit' })
    const s = await prisma.stock.update({ where: { id: Number(id) }, data: { name, unit: nu, quantity: Number(quantity), minLevel: Number(minLevel) } })
    const NAME_MAP2 = {
      'kent@machazen.id': 'Kent Susanto',
      'bukanalden@gmail.com': 'Joshua Alden',
      'jersy_istri@zhongli.com': 'Jersy Liora',
      'leenciaaa@gmail.com': 'Patricia Aileen',
      'lauren@machazen.id': 'Laurencia Aurelia Calysta',
    }
    const fullName2 = NAME_MAP2[user.email] || user.email
    const note = `Perubahan Stock Diubah Oleh (${fullName2})
Nama: ${old.name} -> ${name}
Unit: ${old.unit} -> ${nu}
Qty: ${old.quantity} -> ${Number(quantity)}`
    const countLogs = await prisma.stockLog.count({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } } })
    if (countLogs >= 100) {
      const oldest = await prisma.stockLog.findFirst({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } }, orderBy: { createdAt: 'asc' } })
      if (oldest) await prisma.stockLog.delete({ where: { id: oldest.id } })
    }
    await prisma.stockLog.create({ data: { stockId: Number(id), action: 'update', quantity: Number(quantity), userId: user.userId, note } })
    return res.json(s)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    const old = await prisma.stock.findUnique({ where: { id: Number(id) } })
    if (old) {
      const NAME_MAP3 = {
        'kent@machazen.id': 'Kent Susanto',
        'bukanalden@gmail.com': 'Joshua Alden',
        'jersy_istri@zhongli.com': 'Jersy Liora',
        'leenciaaa@gmail.com': 'Patricia Aileen',
        'lauren@machazen.id': 'Laurencia Aurelia Calysta',
      }
      const fullName3 = NAME_MAP3[user.email] || user.email
      const note = `Penghapusan Stock (${old.name}) Telah Dihapus Oleh (${fullName3})`
      const countLogs = await prisma.stockLog.count({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } } })
      if (countLogs >= 100) {
        const oldest = await prisma.stockLog.findFirst({ where: { NOT: { action: { in: ['NOTE_ADD', 'NOTE_DELETE'] } } }, orderBy: { createdAt: 'asc' } })
        if (oldest) await prisma.stockLog.delete({ where: { id: oldest.id } })
      }
      await prisma.stockLog.create({ data: { stockId: Number(id), action: 'delete', quantity: Number(old.quantity), userId: user.userId, note } })
    }
    await prisma.stock.delete({ where: { id: Number(id) } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
