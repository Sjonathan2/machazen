const prisma = require('../../../lib/prisma')
const bcrypt = require('bcryptjs')
const { signJWT, createSessionCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password diperlukan' })
  }

  try {
    const SEED_USERS = {
      'kent@machazen.id':     { password: 'machazen4life',       role: 'owner' },
      'bukanalden@gmail.com': { password: '12345678',            role: 'pegawai' },
      'jersy_istri@zhongli.com': { password: 'osmanthus wine',   role: 'pegawai' },
      'leenciaaa@gmail.com':  { password: 'iluvmatcha',          role: 'pegawai' },
      'lauren@machazen.id':   { password: 'ilovematchapolguys',  role: 'pegawai' },
    }

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user && SEED_USERS[email]) {
      const hashed = await bcrypt.hash(SEED_USERS[email].password, 10)
      user = await prisma.user.create({ data: { email, password: hashed, role: SEED_USERS[email].role } })
    }
    if (!user) return res.status(401).json({ error: 'User tidak ditemukan' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Password salah' })

    const token = signJWT({ userId: user.id, role: user.role, email: user.email })
    res.setHeader('Set-Cookie', createSessionCookie(token))
    return res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
