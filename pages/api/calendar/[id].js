const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const id = Number(req.query.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'PUT') {
    const { date, timeLabel, time24, title, location, details } = req.body || {}
    const updated = await prisma.calendarEvent.update({ where: { id }, data: { date: String(date), timeLabel: String(timeLabel), time24: String(time24), title: String(title), location: location ? String(location) : null, details: details ? String(details) : null } })
    return res.json(updated)
  }

  if (req.method === 'DELETE') {
    await prisma.calendarEvent.delete({ where: { id } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
