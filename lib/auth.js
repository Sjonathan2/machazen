const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod'

function createSessionCookie(token) {
  const maxAge = 8 * 60 * 60 // 8 hours in seconds
  const secure = process.env.NODE_ENV === 'production' ? 'Secure' : ''
  return `auth_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; ${secure}`.trim()
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

function signJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })
}

function getAuthFromCookie(req) {
  const cookies = req.headers.cookie || ''
  const cookieObj = {}
  cookies.split(';').forEach((c) => {
    const [key, val] = c.trim().split('=')
    if (key && val) cookieObj[key] = decodeURIComponent(val)
  })
  if (!cookieObj.auth_token) return null
  return verifyJWT(cookieObj.auth_token)
}

module.exports = {
  createSessionCookie,
  verifyJWT,
  signJWT,
  getAuthFromCookie,
}
