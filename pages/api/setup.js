const prisma = require('../../lib/prisma')

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS \`User\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`email\` VARCHAR(191) NOT NULL,
  \`password\` VARCHAR(191) NOT NULL,
  \`role\` VARCHAR(191) NOT NULL DEFAULT 'pegawai',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX \`User_email_key\`(\`email\`),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`Stock\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(191) NOT NULL,
  \`unit\` VARCHAR(191) NOT NULL,
  \`quantity\` DOUBLE NOT NULL DEFAULT 0,
  \`minLevel\` DOUBLE NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`Note\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`title\` TEXT NOT NULL,
  \`content\` TEXT NOT NULL,
  \`authorId\` INT NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`StockLog\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`stockId\` INT NOT NULL,
  \`action\` VARCHAR(191) NOT NULL,
  \`quantity\` DOUBLE NOT NULL,
  \`note\` TEXT,
  \`userId\` INT NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`Recipe\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(191) NOT NULL,
  \`price\` DOUBLE NOT NULL DEFAULT 0,
  \`description\` TEXT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX \`Recipe_name_key\`(\`name\`),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`RecipeIngredient\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`recipeId\` INT NOT NULL,
  \`stockId\` INT NOT NULL,
  \`quantity\` DOUBLE NOT NULL,
  \`unit\` VARCHAR(191),
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`SalesOrder\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`customerName\` VARCHAR(191),
  \`total\` DOUBLE NOT NULL DEFAULT 0,
  \`paid\` TINYINT NOT NULL DEFAULT 0,
  \`userId\` INT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`SalesOrderItem\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`orderId\` INT NOT NULL,
  \`recipeId\` INT,
  \`name\` VARCHAR(191) NOT NULL,
  \`unit\` VARCHAR(191),
  \`price\` DOUBLE NOT NULL DEFAULT 0,
  \`quantity\` DOUBLE NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`PurchaseOrder\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`place\` VARCHAR(191),
  \`userId\` INT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`PurchaseItem\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`orderId\` INT NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`unit\` VARCHAR(191),
  \`qtyItems\` DOUBLE NOT NULL DEFAULT 0,
  \`net\` DOUBLE NOT NULL DEFAULT 0,
  \`pricePerItem\` DOUBLE NOT NULL DEFAULT 0,
  \`totalPrice\` DOUBLE NOT NULL DEFAULT 0,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
CREATE TABLE IF NOT EXISTS \`CalendarEvent\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`date\` VARCHAR(191) NOT NULL,
  \`timeLabel\` VARCHAR(191) NOT NULL,
  \`time24\` VARCHAR(191) NOT NULL,
  \`title\` VARCHAR(191) NOT NULL,
  \`location\` VARCHAR(191),
  \`details\` TEXT,
  \`userId\` INT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
);
`.trim()

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  const secret = process.env.SETUP_SECRET || 'setup123'
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized. Send header: Authorization: Bearer setup123' })
  }

  try {
    const tables = ['User','Stock','Note','StockLog','Recipe','RecipeIngredient','SalesOrder','SalesOrderItem','PurchaseOrder','PurchaseItem','CalendarEvent']
    const existing = await prisma.$queryRawUnsafe(`SHOW TABLES`)
    const existingNames = existing.map(r => Object.values(r)[0])
    const missing = tables.filter(t => !existingNames.includes(t))

    if (missing.length === 0) {
      return res.json({ message: 'All tables already exist', status: 'ok' })
    }

    const statements = CREATE_TABLES_SQL.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt.trim() + ';')
    }

    return res.json({ message: `Created ${missing.length} missing tables: ${missing.join(', ')}`, status: 'ok' })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0,3).join('\n') })
  }
}
