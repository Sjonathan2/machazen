const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

function toPoints(series) {
  return series.map((v, i) => ({ x: i + 1, y: v }))
}

function linearRegression(points) {
  const n = points.length
  if (n === 0) return { a: 0, b: 0 }
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (const p of points) { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x }
  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1)
  const a = (sumY - b * sumX) / n
  return { a, b }
}

export default async function handler(req, res) {
  const auth = getAuthFromCookie(req)
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const { horizon = '7', group = 'day' } = req.query
  const h = Math.max(1, parseInt(horizon, 10) || 7)
  const sales = await prisma.salesOrder.findMany({ orderBy: { createdAt: 'asc' } })

  const map = {}
  for (const s of sales) {
    const d = new Date(s.createdAt)
    const key = group === 'week' ? `${d.getFullYear()}-W${Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay())) / 7)}` : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    map[key] = (map[key] || 0) + (Number(s.total) || 0)
  }
  const keys = Object.keys(map).sort((a,b)=>a.localeCompare(b))
  const series = keys.map(k => map[k])
  const points = toPoints(series)
  const { a, b } = linearRegression(points)
  const forecast = []
  const lastX = points.length > 0 ? points[points.length - 1].x : 0
  for (let i = 1; i <= h; i++) { forecast.push(Math.max(0, a + b * (lastX + i))) }
  res.json({ history: series, forecast })
}

