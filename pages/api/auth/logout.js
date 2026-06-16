export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC')
  return res.json({ success: true })
}
