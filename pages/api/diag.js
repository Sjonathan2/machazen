const prisma = require('../../lib/prisma')

export default async function handler(req, res) {
  try {
    const url = process.env.DATABASE_URL || '(not set)'
    const maskedUrl = url.replace(/\/\/.*?@/, '//***:***@')
    const jwtSecret = process.env.JWT_SECRET ? 'exists' : 'missing'

    let dbOk = false
    let dbError = null
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 as ping`)
      dbOk = true
    } catch (e) {
      dbError = e.message
    }

    let tables = []
    try {
      const result = await prisma.$queryRawUnsafe(`SHOW TABLES`)
      tables = result.map(r => Object.values(r)[0])
    } catch (e) {
      tables = [`ERROR: ${e.message}`]
    }

    return res.json({
      status: dbOk ? 'db connected' : 'db error',
      dbUrl: maskedUrl,
      jwtSecret,
      tables,
      dbError,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: String(err) })
  }
}
