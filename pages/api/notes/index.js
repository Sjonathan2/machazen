const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const NAME_MAP = {
    'kent@machazen.id': 'Kent Susanto',
    'bukanalden@gmail.com': 'Joshua Alden',
    'jersy_istri@zhongli.com': 'Jersy Liora',
    'leenciaaa@gmail.com': 'Patricia Aileen',
    'lauren@machazen.id': 'Laurencia Aurelia Calysta',
  }
  const fullName = NAME_MAP[user.email] || user.email

  if (req.method === 'GET') {
    const notes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return res.json(notes)
  }

  if (req.method === 'POST') {
    const { title, content } = req.body
    const note = await prisma.note.create({ data: { title, content, authorId: user.userId } })
    await prisma.stockLog.create({ data: { stockId: 0, action: 'NOTE_ADD', quantity: 0, note: `Catatan (${title}) Dibuat Oleh (${fullName})`, userId: user.userId } })
    const excluded = ['FINANCE_TX','BUDGET','FORECAST','METRIC_TOTAL_PRODUCTS_SOLD']
    const countUserNotes = await prisma.note.count({ where: { NOT: { title: { in: excluded } } } })
    if (countUserNotes > 100) {
      const oldestUserNote = await prisma.note.findFirst({ where: { NOT: { title: { in: excluded } } }, orderBy: { createdAt: 'asc' } })
      if (oldestUserNote) await prisma.note.delete({ where: { id: oldestUserNote.id } })
    }
    return res.json(note)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    const existing = await prisma.note.findUnique({ where: { id: Number(id) } })
    await prisma.note.delete({ where: { id: Number(id) } })
    const title = existing?.title || '(tanpa judul)'
    await prisma.stockLog.create({ data: { stockId: 0, action: 'NOTE_DELETE', quantity: 0, note: `Catatan (${title}) Dihapus Oleh (${fullName})`, userId: user.userId } })
    return res.json({ success: true })
  }

  res.status(405).end()
}
