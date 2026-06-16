const prisma = require('../../lib/prisma')
const { getAuthFromCookie } = require('../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { key } = req.query || {}
    if (!key) return res.status(400).json({ error: 'key required' })
    const notes = await prisma.note.findMany({ where: { title: String(key) }, orderBy: { id: 'desc' }, take: 1 })
    const val = notes.length > 0 ? Number(notes[0].content || '0') || 0 : 0
    return res.json({ key: String(key), value: val })
  }

  res.status(405).end()
}
