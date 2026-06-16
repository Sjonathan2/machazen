const prisma = require('../../lib/prisma')
const bcrypt = require('bcryptjs')

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(7 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0)
  return d
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  const secret = process.env.SETUP_SECRET || 'setup123'
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Use header: Authorization: Bearer setup123' })
  }
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const existing = await prisma.salesOrder.count()
    if (existing > 0) {
      return res.json({ message: 'Data already exists. Skip seeding.' })
    }

    const users = await prisma.user.findMany()
    const kentId = users.find(u => u.email === 'kent@machazen.id').id
    const employeeIds = users.filter(u => u.email !== 'kent@machazen.id').map(u => u.id)
    function randomUserId() { return employeeIds[Math.floor(Math.random() * employeeIds.length)] }

    const stockItems = [
      { name: 'Matcha Powder', unit: 'gram', quantity: 2500, minLevel: 500 },
      { name: 'Gula Pasir', unit: 'gram', quantity: 8000, minLevel: 2000 },
      { name: 'Susu UHT', unit: 'ml', quantity: 15000, minLevel: 3000 },
      { name: 'Susu Full Cream', unit: 'ml', quantity: 12000, minLevel: 3000 },
      { name: 'Bubuk Coklat', unit: 'gram', quantity: 3000, minLevel: 500 },
      { name: 'Bubuk Vanilla', unit: 'gram', quantity: 1500, minLevel: 300 },
      { name: 'Creamer Bubuk', unit: 'gram', quantity: 2500, minLevel: 500 },
      { name: 'Krim Kocok', unit: 'gram', quantity: 1200, minLevel: 300 },
      { name: 'Sirup Gula', unit: 'ml', quantity: 4000, minLevel: 800 },
      { name: 'Tepung Tapioka', unit: 'gram', quantity: 5000, minLevel: 1000 },
      { name: 'Tepung Terigu', unit: 'gram', quantity: 6000, minLevel: 1000 },
      { name: 'Cup + Tutup', unit: 'pieces', quantity: 400, minLevel: 80 },
      { name: 'Sedotan', unit: 'pieces', quantity: 500, minLevel: 100 },
      { name: 'Es Batu', unit: 'pieces', quantity: 600, minLevel: 150 },
      { name: 'Matcha Ice Cream', unit: 'pieces', quantity: 120, minLevel: 30 },
      { name: 'Telur', unit: 'gram', quantity: 3000, minLevel: 500 },
      { name: 'Mentega', unit: 'gram', quantity: 1500, minLevel: 300 },
      { name: 'Keju Cream', unit: 'gram', quantity: 1000, minLevel: 200 },
      { name: 'Boba Pearl (Kering)', unit: 'gram', quantity: 4000, minLevel: 800 },
      { name: 'Plastik Kemasan', unit: 'pieces', quantity: 200, minLevel: 50 },
    ]
    await prisma.stock.createMany({ data: stockItems })
    const allStocks = await prisma.stock.findMany()
    function stockByName(name) { return allStocks.find(s => s.name === name) }

    const recipes = [
      {
        name: 'Matcha Latte', price: 25000, description: 'Minuman matcha klasik dengan susu segar',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Susu UHT', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Frappe', price: 30000, description: 'Matcha dingin blended dengan es krim',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Susu UHT', qty: 150, unit: 'ml' },
          { stockName: 'Es Batu', qty: 5, unit: 'pieces' },
          { stockName: 'Krim Kocok', qty: 20, unit: 'gram' },
          { stockName: 'Sirup Gula', qty: 20, unit: 'ml' },
        ],
      },
      {
        name: 'Coklat Matcha', price: 28000, description: 'Perpaduan matcha dan coklat yang nikmat',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
          { stockName: 'Bubuk Coklat', qty: 10, unit: 'gram' },
          { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Boba', price: 32000, description: 'Matcha latte dengan topping boba kenyal',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Boba Pearl (Kering)', qty: 40, unit: 'gram' },
          { stockName: 'Sirup Gula', qty: 25, unit: 'ml' },
        ],
      },
      {
        name: 'Vanilla Matcha', price: 27000, description: 'Matcha dengan sentuhan vanilla yang lembut',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
          { stockName: 'Bubuk Vanilla', qty: 5, unit: 'gram' },
          { stockName: 'Susu UHT', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Ice Cream Delight', price: 35000, description: 'Es krim matcha dengan whipped cream',
        ingredients: [
          { stockName: 'Matcha Ice Cream', qty: 2, unit: 'pieces' },
          { stockName: 'Krim Kocok', qty: 30, unit: 'gram' },
          { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
        ],
      },
      {
        name: 'Matcha Cookies', price: 15000, description: 'Kukis matcha homemade yang renyah',
        ingredients: [
          { stockName: 'Tepung Terigu', qty: 100, unit: 'gram' },
          { stockName: 'Gula Pasir', qty: 50, unit: 'gram' },
          { stockName: 'Matcha Powder', qty: 5, unit: 'gram' },
          { stockName: 'Mentega', qty: 40, unit: 'gram' },
          { stockName: 'Telur', qty: 25, unit: 'gram' },
        ],
      },
      {
        name: 'Matcha Cream Cheese', price: 30000, description: 'Matcha dengan cream cheese yang creamy',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Keju Cream', qty: 30, unit: 'gram' },
          { stockName: 'Susu Full Cream', qty: 180, unit: 'ml' },
          { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Susu Kocok', price: 26000, description: 'Matcha dengan susu kocok lembut di atasnya',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Krim Kocok', qty: 15, unit: 'gram' },
          { stockName: 'Sirup Gula', qty: 20, unit: 'ml' },
        ],
      },
      {
        name: 'Iced Matcha', price: 22000, description: 'Matcha segar dengan es batu',
        ingredients: [
          { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
          { stockName: 'Susu UHT', qty: 150, unit: 'ml' },
          { stockName: 'Es Batu', qty: 3, unit: 'pieces' },
          { stockName: 'Sirup Gula', qty: 12, unit: 'ml' },
        ],
      },
    ]

    const createdRecipes = []
    for (const r of recipes) {
      const recipe = await prisma.recipe.create({ data: { name: r.name, price: r.price, description: r.description } })
      for (const ing of r.ingredients) {
        const stock = stockByName(ing.stockName)
        if (stock) {
          await prisma.recipeIngredient.create({ data: { recipeId: recipe.id, stockId: stock.id, quantity: ing.qty, unit: ing.unit } })
        }
      }
      createdRecipes.push(recipe)
    }

    const customerNames = ['Budi Santoso', 'Siti Rahma', 'Andi Wijaya', 'Rina Amelia', 'Doni Prasetyo', 'Maya Sari', 'Agus Hartono', 'Dewi Lestari', 'Hendra Gunawan', 'Lisa Permata', 'Rizky Pratama', 'Nurul Hidayah', 'Bayu Saputra', 'Citra Dewi', 'Fajar Ramadhan']
    let totalProductsSold = 0
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const ordersToday = Math.floor(Math.random() * 4) + 1
      for (let o = 0; o < ordersToday; o++) {
        const customerName = customerNames[Math.floor(Math.random() * customerNames.length)]
        const itemCount = Math.floor(Math.random() * 3) + 1
        const items = []
        let orderTotal = 0
        for (let i = 0; i < itemCount; i++) {
          const recipe = createdRecipes[Math.floor(Math.random() * createdRecipes.length)]
          const qty = Math.floor(Math.random() * 3) + 1
          items.push({ recipe, qty })
          orderTotal += recipe.price * qty
        }
        const paid = Math.random() > 0.15
        const createdDate = daysAgo(dayOffset)
        const order = await prisma.salesOrder.create({ data: { customerName, total: orderTotal, paid, userId: randomUserId(), createdAt: createdDate } })
        for (const it of items) {
          await prisma.salesOrderItem.create({ data: { orderId: order.id, recipeId: it.recipe.id, name: it.recipe.name, unit: 'pieces', price: it.recipe.price, quantity: it.qty, createdAt: createdDate } })
          totalProductsSold += it.qty
        }
      }
    }

    const expenses = [
      { amount: 1500000, source: 'sewa', description: 'Sewa Tempat Bulanan', kind: 'beban', category: 'Sewa Tempat', method: 'Transfer', date: daysAgo(25) },
      { amount: 350000, source: 'listrik', description: 'Tagihan Listrik', kind: 'beban', category: 'Listrik & Air', method: 'Transfer', date: daysAgo(20) },
      { amount: 1800000, source: 'gaji', description: 'Gaji 4 Karyawan', kind: 'beban', category: 'Gaji Karyawan', method: 'Transfer', date: daysAgo(14) },
    ]
    for (const exp of expenses) {
      await prisma.note.create({ data: { title: 'FINANCE_TX', content: JSON.stringify({ type: 'expense', kind: exp.kind, amount: exp.amount, date: exp.date.toISOString(), description: exp.description, source: exp.source, category: exp.category, subCategory: null, method: exp.method }), authorId: kentId, createdAt: exp.date } })
    }

    await prisma.note.create({ data: { title: 'METRIC_TOTAL_PRODUCTS_SOLD', content: String(totalProductsSold), authorId: kentId } })

    res.json({ message: 'Seed completed!', stats: { stocks: stockItems.length, recipes: recipes.length, salesOrders: '~60 orders' } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
