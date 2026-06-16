export default async function handler(req, res) {
  try {
    const prisma = require('../../lib/prisma')
    const userCount = await prisma.user.count()
    const url = process.env.DATABASE_URL || 'none'
    res.json({
      status: 'ok',
      hasUrl: url !== 'none',
      hasSSL: url.includes('ssl'),
      urlSuffix: url.slice(-50),
      counts: { users: userCount },
    })
  } catch (err) {
    const url = process.env.DATABASE_URL || 'none'
    res.status(500).json({
      error: err.message,
      code: err.code,
      meta: err.meta,
      hasUrl: url !== 'none',
      hasSSL: url.includes('ssl'),
      urlSuffix: url.slice(-50),
    })
  }
}
