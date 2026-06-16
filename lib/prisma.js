const { PrismaClient } = require('@prisma/client')

function createPrismaClient() {
  const url = process.env.DATABASE_URL || ''
  if (url.includes('tidbcloud.com') && !url.includes('ssl=')) {
    process.env.DATABASE_URL = url + (url.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}'
  }
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })
}

const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV === 'development') global.prisma = prisma

module.exports = prisma
