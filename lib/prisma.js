const { PrismaClient } = require('@prisma/client')

function createPrismaClient() {
  let url = process.env.DATABASE_URL || ''
  if (url && url.includes('tidbcloud.com') && !url.includes('ssl=')) {
    const sslVal = JSON.stringify({ rejectUnauthorized: true })
    const sep = url.includes('?') ? '&' : '?'
    url = url + sep + 'ssl=' + encodeURIComponent(sslVal)
    process.env.DATABASE_URL = url
  }
  if (!url) {
    console.error('DATABASE_URL is not set!')
  }
  const client = new PrismaClient()
  return client
}

const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV === 'development') global.prisma = prisma

module.exports = prisma
