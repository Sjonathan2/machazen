const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { from, to, date } = req.query
    if (date) {
      const list = await prisma.calendarEvent.findMany({ where: { date: String(date) }, orderBy: { time24: 'asc' } })
      return res.json(list)
    }
    if (from && to) {
      const list = await prisma.calendarEvent.findMany({ where: { date: { gte: String(from), lte: String(to) } }, orderBy: [{ date: 'asc' }, { time24: 'asc' }] })
      return res.json(list)
    }
    const list = await prisma.calendarEvent.findMany({ orderBy: [{ date: 'asc' }, { time24: 'asc' }], take: 500 })
    return res.json(list)
  }

  if (req.method === 'POST') {
    const { date, timeLabel, time24, title, location, details } = req.body || {}
    if (!date || !timeLabel || !time24 || !title) return res.status(400).json({ error: 'Missing fields' })
    const dup = await prisma.calendarEvent.findFirst({ where: { date: String(date), time24: String(time24) } })
    if (dup) return res.status(409).json({ error: 'Duplicate time' })
    const created = await prisma.calendarEvent.create({ data: { date: String(date), timeLabel: String(timeLabel), time24: String(time24), title: String(title), location: location ? String(location) : null, details: details ? String(details) : null, userId: user.userId } })
    return res.json(created)
  }

  res.status(405).end()
}
