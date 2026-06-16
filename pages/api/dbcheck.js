const dns = require('dns')
const net = require('net')
const tls = require('tls')

export default async function handler(req, res) {
  const results = {}

  // Parse URL
  const url = process.env.DATABASE_URL || ''
  let host = 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com'
  let port = 4000
  try {
    const match = url.match(/@([^:]+):(\d+)/)
    if (match) { host = match[1]; port = parseInt(match[2]) }
  } catch {}

  // DNS
  try {
    const dnsResult = await new Promise((resolve, reject) => {
      dns.resolve4(host, (err, addresses) => {
        if (err) reject(err)
        else resolve(addresses)
      })
    })
    results.dns = dnsResult
  } catch (e) {
    results.dns = `FAILED: ${e.message}`
  }

  // TCP connect
  try {
    await new Promise((resolve, reject) => {
      const socket = net.createConnection(port, host, () => {
        results.tcp = 'connected'
        socket.end()
        resolve()
      })
      socket.setTimeout(10000)
      socket.on('timeout', () => { socket.destroy(); reject(new Error('TCP timeout')) })
      socket.on('error', (err) => reject(err))
    })
  } catch (e) {
    results.tcp = `FAILED: ${e.message}`
  }

  // TLS handshake
  if (results.tcp === 'connected') {
    try {
      await new Promise((resolve, reject) => {
        const socket = tls.connect(port, host, {
          rejectUnauthorized: false
        }, () => {
          results.tls = {
            authorized: socket.authorized,
            protocol: socket.getProtocol(),
            cipher: socket.getCipher()?.name,
          }
          socket.end()
          resolve()
        })
        socket.setTimeout(10000)
        socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS timeout')) })
        socket.on('error', (err) => reject(err))
      })
    } catch (e) {
      results.tls = `FAILED: ${e.message}`
    }
  }

  res.json({
    host,
    port,
    url: url.replace(/\/\/.*?:.*?@/, '//***:***@'),
    results,
  })
}
