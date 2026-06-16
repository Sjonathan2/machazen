const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  return res.json({ user })
}
