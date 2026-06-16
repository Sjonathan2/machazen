export function withAuthAPI(handler) {
  return async (req, res) => {
    const { getAuthFromCookie } = require('../lib/auth')
    const user = getAuthFromCookie(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.user = user
    return handler(req, res)
  }
}
