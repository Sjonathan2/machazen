export default async function handler(req, res) {
  const url = process.env.DATABASE_URL || 'NOT SET'
  const masked = url.replace(/\/\/.*?:.*?@/, '//***:***@')
  return res.json({
    status: 'ok',
    DATABASE_URL: masked,
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
  })
}
