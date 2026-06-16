const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const TITLE = 'FINANCE_LOG'

  if (req.method === 'GET') {
    const notes = await prisma.note.findMany({ where: { title: TITLE }, orderBy: { id: 'desc' }, take: 100 })
    return res.json(notes.map(n => ({ id: n.id, content: n.content || '', createdAt: n.createdAt })))
  }

  if (req.method === 'POST') {
    const { message } = req.body || {}
    const NAME_MAP = {
      'kent@machazen.id': 'Kent Susanto',
      'bukanalden@gmail.com': 'Joshua Alden',
      'jersy_istri@zhongli.com': 'Jersy Liora',
      'leenciaaa@gmail.com': 'Patricia Aileen',
      'lauren@machazen.id': 'Laurencia Aurelia Calysta',
    }
    const fullName = NAME_MAP[user.email] || user.email
    const content = `${String(message||'')}\nAktivitas yang dilakukan oleh pengguna Oleh (${fullName})`
    const count = await prisma.note.count({ where: { title: TITLE } })
    if (count >= 100) {
      const oldest = await prisma.note.findFirst({ where: { title: TITLE }, orderBy: { id: 'asc' } })
      if (oldest) await prisma.note.delete({ where: { id: oldest.id } })
    }
    const created = await prisma.note.create({ data: { title: TITLE, content, authorId: user.userId } })
    return res.json({ id: created.id, content: created.content, createdAt: created.createdAt })
  }

  if (req.method === 'DELETE') {
    await prisma.note.deleteMany({ where: { title: TITLE } })
    return res.json({ ok: true })
  }

  return res.status(405).end()
}

