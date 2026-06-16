const prisma = require('../../lib/prisma')
const bcrypt = require('bcryptjs')

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(7 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0)
  return d
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  const secret = process.env.SETUP_SECRET || 'setup123'
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Use header: Authorization: Bearer setup123' })
  }
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // --- CLEAR existing data ---
    await prisma.calendarEvent.deleteMany()
    await prisma.purchaseItem.deleteMany()
    await prisma.purchaseOrder.deleteMany()
    await prisma.salesOrderItem.deleteMany()
    await prisma.salesOrder.deleteMany()
    await prisma.recipeIngredient.deleteMany()
    await prisma.recipe.deleteMany()
    await prisma.stockLog.deleteMany()
    await prisma.note.deleteMany()
    await prisma.stock.deleteMany()

    // --- USERS ---
    const users = await prisma.user.findMany()
    const kentId = users.find(u => u.email === 'kent@machazen.id').id
    const joshuaId = users.find(u => u.email === 'bukanalden@gmail.com')?.id
    const jersyId = users.find(u => u.email === 'jersy_istri@zhongli.com')?.id
    const patriciaId = users.find(u => u.email === 'leenciaaa@gmail.com')?.id
    const laurenciaId = users.find(u => u.email === 'lauren@machazen.id')?.id
    const employeeIds = [joshuaId, jersyId, patriciaId, laurenciaId].filter(Boolean)
    function randomUserId() { return employeeIds[Math.floor(Math.random() * employeeIds.length)] }

    // --- STOCK (30 items) ---
    const stockItems = [
      { name: 'Matcha Powder (Premium)', unit: 'gram', quantity: 5000, minLevel: 800 },
      { name: 'Matcha Powder (Reguler)', unit: 'gram', quantity: 8000, minLevel: 1500 },
      { name: 'Gula Pasir Putih', unit: 'gram', quantity: 15000, minLevel: 3000 },
      { name: 'Gula Merah', unit: 'gram', quantity: 5000, minLevel: 1000 },
      { name: 'Susu UHT Full Cream', unit: 'ml', quantity: 25000, minLevel: 5000 },
      { name: 'Susu UHT Low Fat', unit: 'ml', quantity: 10000, minLevel: 2000 },
      { name: 'Susu Evaporasi', unit: 'ml', quantity: 6000, minLevel: 1000 },
      { name: 'Susu Kental Manis', unit: 'ml', quantity: 4000, minLevel: 800 },
      { name: 'Bubuk Coklat Premium', unit: 'gram', quantity: 4000, minLevel: 800 },
      { name: 'Bubuk Coklat Reguler', unit: 'gram', quantity: 3000, minLevel: 500 },
      { name: 'Bubuk Vanilla', unit: 'gram', quantity: 2000, minLevel: 400 },
      { name: 'Creamer Bubuk', unit: 'gram', quantity: 3000, minLevel: 600 },
      { name: 'Whipped Cream Cair', unit: 'ml', quantity: 2000, minLevel: 400 },
      { name: 'Sirup Gula Cair', unit: 'ml', quantity: 6000, minLevel: 1000 },
      { name: 'Sirup Karamel', unit: 'ml', quantity: 2000, minLevel: 400 },
      { name: 'Sirup Red Velvet', unit: 'ml', quantity: 1500, minLevel: 300 },
      { name: 'Tepung Tapioka (Boba)', unit: 'gram', quantity: 8000, minLevel: 1500 },
      { name: 'Tepung Terigu Protein Tinggi', unit: 'gram', quantity: 10000, minLevel: 2000 },
      { name: 'Mentega Tawar', unit: 'gram', quantity: 3000, minLevel: 500 },
      { name: 'Telur Ayam Negeri', unit: 'gram', quantity: 5000, minLevel: 1000 },
      { name: 'Keju Cream Cheese', unit: 'gram', quantity: 2000, minLevel: 400 },
      { name: 'Matcha Ice Cream Cup', unit: 'pieces', quantity: 200, minLevel: 40 },
      { name: 'Es Batu Kristal', unit: 'pieces', quantity: 1000, minLevel: 200 },
      { name: 'Cup + Tutup 16oz', unit: 'pieces', quantity: 600, minLevel: 100 },
      { name: 'Cup + Tutup 22oz', unit: 'pieces', quantity: 400, minLevel: 80 },
      { name: 'Sedotan Biodegradable', unit: 'pieces', quantity: 800, minLevel: 150 },
      { name: 'Plastik Kemasan', unit: 'pieces', quantity: 300, minLevel: 50 },
      { name: 'Boba Pearl (Instant)', unit: 'gram', quantity: 6000, minLevel: 1000 },
      { name: 'Jelly Powder (Grass)', unit: 'gram', quantity: 2000, minLevel: 400 },
      { name: 'Cincau Hitam', unit: 'gram', quantity: 3000, minLevel: 500 },
    ]
    await prisma.stock.createMany({ data: stockItems })
    const allStocks = await prisma.stock.findMany()
    function stockByName(name) { return allStocks.find(s => s.name === name) }

    // --- RECIPES (15 menu) ---
    const recipes = [
      {
        name: 'Matcha Latte', price: 25000,
        description: 'Minuman matcha klasik dengan susu segar',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Latte Large', price: 32000,
        description: 'Matcha Latte ukuran jumbo 22oz',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 5, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 350, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 25, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Frappe', price: 33000,
        description: 'Matcha dingin blended dengan whipped cream',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 4, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 150, unit: 'ml' },
          { stockName: 'Es Batu Kristal', qty: 6, unit: 'pieces' },
          { stockName: 'Whipped Cream Cair', qty: 25, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 20, unit: 'ml' },
        ],
      },
      {
        name: 'Coklat Matcha', price: 30000,
        description: 'Perpaduan matcha dan coklat yang nikmat',
        ingredients: [
          { stockName: 'Matcha Powder (Reguler)', qty: 2, unit: 'gram' },
          { stockName: 'Bubuk Coklat Premium', qty: 12, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Boba', price: 35000,
        description: 'Matcha latte dengan topping boba kenyal',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Boba Pearl (Instant)', qty: 50, unit: 'gram' },
          { stockName: 'Sirup Gula Cair', qty: 25, unit: 'ml' },
        ],
      },
      {
        name: 'Vanilla Matcha', price: 28000,
        description: 'Matcha dengan sentuhan vanilla yang lembut',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 2, unit: 'gram' },
          { stockName: 'Bubuk Vanilla', qty: 6, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Ice Cream Delight', price: 38000,
        description: 'Es krim matcha dengan whipped cream dan topping',
        ingredients: [
          { stockName: 'Matcha Ice Cream Cup', qty: 2, unit: 'pieces' },
          { stockName: 'Whipped Cream Cair', qty: 35, unit: 'ml' },
          { stockName: 'Matcha Powder (Premium)', qty: 2, unit: 'gram' },
        ],
      },
      {
        name: 'Matcha Cookies', price: 18000,
        description: 'Kukis matcha homemade 3 pcs',
        ingredients: [
          { stockName: 'Tepung Terigu Protein Tinggi', qty: 120, unit: 'gram' },
          { stockName: 'Gula Pasir Putih', qty: 60, unit: 'gram' },
          { stockName: 'Matcha Powder (Reguler)', qty: 6, unit: 'gram' },
          { stockName: 'Mentega Tawar', qty: 45, unit: 'gram' },
          { stockName: 'Telur Ayam Negeri', qty: 30, unit: 'gram' },
        ],
      },
      {
        name: 'Matcha Cream Cheese', price: 32000,
        description: 'Matcha dengan cream cheese yang creamy',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Keju Cream Cheese', qty: 35, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 180, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 15, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Susu Kocok', price: 28000,
        description: 'Matcha dengan susu kocok lembut di atasnya',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Susu Evaporasi', qty: 200, unit: 'ml' },
          { stockName: 'Whipped Cream Cair', qty: 20, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 20, unit: 'ml' },
        ],
      },
      {
        name: 'Iced Matcha', price: 24000,
        description: 'Matcha segar dengan es batu',
        ingredients: [
          { stockName: 'Matcha Powder (Reguler)', qty: 4, unit: 'gram' },
          { stockName: 'Susu UHT Low Fat', qty: 150, unit: 'ml' },
          { stockName: 'Es Batu Kristal', qty: 4, unit: 'pieces' },
          { stockName: 'Sirup Gula Cair', qty: 12, unit: 'ml' },
        ],
      },
      {
        name: 'Red Velvet Matcha', price: 34000,
        description: 'Matcha dengan sirup red velvet yang manis',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 2, unit: 'gram' },
          { stockName: 'Sirup Red Velvet', qty: 20, unit: 'ml' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Keju Cream Cheese', qty: 20, unit: 'gram' },
        ],
      },
      {
        name: 'Matcha Karamel', price: 30000,
        description: 'Matcha dengan sirup karamel yang manis gurih',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Sirup Karamel', qty: 20, unit: 'ml' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 10, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Cincau', price: 30000,
        description: 'Matcha latte dengan topping cincau hitam segar',
        ingredients: [
          { stockName: 'Matcha Powder (Reguler)', qty: 3, unit: 'gram' },
          { stockName: 'Cincau Hitam', qty: 50, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 20, unit: 'ml' },
        ],
      },
      {
        name: 'Matcha Jelly', price: 32000,
        description: 'Matcha latte dengan grass jelly homemade',
        ingredients: [
          { stockName: 'Matcha Powder (Premium)', qty: 3, unit: 'gram' },
          { stockName: 'Jelly Powder (Grass)', qty: 30, unit: 'gram' },
          { stockName: 'Susu UHT Full Cream', qty: 200, unit: 'ml' },
          { stockName: 'Sirup Gula Cair', qty: 20, unit: 'ml' },
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

    // --- CUSTOMERS (30+) ---
    const customerNames = [
      'Budi Santoso', 'Siti Rahma', 'Andi Wijaya', 'Rina Amelia', 'Doni Prasetyo',
      'Maya Sari', 'Agus Hartono', 'Dewi Lestari', 'Hendra Gunawan', 'Lisa Permata',
      'Rizky Pratama', 'Nurul Hidayah', 'Bayu Saputra', 'Citra Dewi', 'Fajar Ramadhan',
      'Indah Kusuma', 'Kevin Tanujaya', 'Putri Ayu', 'Reza Pahlevi', 'Sari Indah',
      'Tono Wibisono', 'Vina Anggraini', 'Wahyu Nugroho', 'Yuni Astuti', 'Zaki Ahmad',
      'Ani Susanti', 'Bambang Suprayitno', 'Cindy Lim', 'Dimas Ardiansyah', 'Elsa Fitriana',
      'Haryo Yudhistira', 'Dian Puspita',
    ]

    // --- SALES ORDERS (60 days) ---
    let totalProductsSold = 0
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const dayOfWeek = new Date(daysAgo(dayOffset)).getDay()
      let ordersToday
      if (dayOffset === 0) {
        ordersToday = 0
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        ordersToday = Math.floor(Math.random() * 8) + 5
      } else {
        ordersToday = Math.floor(Math.random() * 5) + 2
      }

      for (let o = 0; o < ordersToday; o++) {
        const customerName = customerNames[Math.floor(Math.random() * customerNames.length)]
        const itemCount = Math.floor(Math.random() * 4) + 1
        const items = []
        let orderTotal = 0
        for (let i = 0; i < itemCount; i++) {
          const recipe = createdRecipes[Math.floor(Math.random() * createdRecipes.length)]
          const qty = Math.floor(Math.random() * 3) + 1
          items.push({ recipe, qty })
          orderTotal += recipe.price * qty
        }
        const paid = Math.random() > 0.12
        const createdDate = daysAgo(dayOffset)
        const order = await prisma.salesOrder.create({
          data: { customerName, total: orderTotal, paid, userId: randomUserId(), createdAt: createdDate },
        })
        for (const it of items) {
          await prisma.salesOrderItem.create({
            data: { orderId: order.id, recipeId: it.recipe.id, name: it.recipe.name, unit: 'pieces', price: it.recipe.price, quantity: it.qty, createdAt: createdDate },
          })
          totalProductsSold += it.qty
        }
      }
    }

    // --- FINANCE TRANSACTIONS (15+) ---
    const financeTx = [
      { amount: 1500000, source: 'sewa', description: 'Sewa Tempat Bulan Juni 2026', method: 'Transfer', date: daysAgo(55), kind: 'beban', category: 'Sewa Tempat' },
      { amount: 1500000, source: 'sewa', description: 'Sewa Tempat Bulan Juli 2026', method: 'Transfer', date: daysAgo(25), kind: 'beban', category: 'Sewa Tempat' },
      { amount: 380000, source: 'listrik', description: 'Tagihan Listrik Juni', method: 'Transfer', date: daysAgo(50), kind: 'beban', category: 'Listrik & Air' },
      { amount: 420000, source: 'listrik', description: 'Tagihan Listrik Juli', method: 'Transfer', date: daysAgo(20), kind: 'beban', category: 'Listrik & Air' },
      { amount: 200000, source: 'air', description: 'Tagihan Air PDAM', method: 'Transfer', date: daysAgo(45), kind: 'beban', category: 'Listrik & Air' },
      { amount: 1500000, source: 'gaji', description: 'Gaji Joshua (Pegawai)', method: 'Transfer', date: daysAgo(48), kind: 'beban', category: 'Gaji Karyawan' },
      { amount: 1500000, source: 'gaji', description: 'Gaji Jersy (Pegawai)', method: 'Transfer', date: daysAgo(48), kind: 'beban', category: 'Gaji Karyawan' },
      { amount: 1500000, source: 'gaji', description: 'Gaji Patricia (Pegawai)', method: 'Transfer', date: daysAgo(48), kind: 'beban', category: 'Gaji Karyawan' },
      { amount: 1500000, source: 'gaji', description: 'Gaji Laurencia (Pegawai)', method: 'Transfer', date: daysAgo(48), kind: 'beban', category: 'Gaji Karyawan' },
      { amount: 1500000, source: 'gaji', description: 'Gaji Karyawan Bulan Juli', method: 'Transfer', date: daysAgo(18), kind: 'beban', category: 'Gaji Karyawan' },
      { amount: 300000, source: 'marketing', description: 'Iklan Instagram Bulan Juni', method: 'Transfer', date: daysAgo(40), kind: 'beban', category: 'Marketing' },
      { amount: 250000, source: 'marketing', description: 'Banner Promo di Toko', method: 'Cash', date: daysAgo(15), kind: 'beban', category: 'Marketing' },
      { amount: 120000, source: 'transportasi', description: 'Bensin & Transportasi', method: 'Cash', date: daysAgo(35), kind: 'beban', category: 'Transportasi' },
      { amount: 100000, source: 'transportasi', description: 'Gojek Delivery Order', method: 'Cash', date: daysAgo(5), kind: 'beban', category: 'Transportasi' },
      { amount: 500000, source: 'catering', description: 'Pesanan Catering Kantor', method: 'Transfer', date: daysAgo(30), kind: 'pendapatan', category: 'Catering' },
      { amount: 350000, source: 'catering', description: 'Minuman Acara Arisan', method: 'Transfer', date: daysAgo(10), kind: 'pendapatan', category: 'Catering' },
    ]
    for (const tx of financeTx) {
      await prisma.note.create({
        data: {
          title: 'FINANCE_TX',
          content: JSON.stringify({ type: tx.kind === 'pendapatan' ? 'income' : 'expense', kind: tx.kind, amount: tx.amount, date: tx.date.toISOString(), description: tx.description, source: tx.source, category: tx.category, subCategory: null, method: tx.method }),
          authorId: kentId, createdAt: tx.date,
        },
      })
    }

    // --- PURCHASE ORDERS (10+) ---
    const purchases = [
      { place: 'Supplier Matcha Indo', daysAgo: 50, items: [{ name: 'Matcha Powder (Premium)', unit: 'gram', qtyItems: 2000, net: 2000, pricePerItem: 200 }, { name: 'Bubuk Coklat Premium', unit: 'gram', qtyItems: 1000, net: 1000, pricePerItem: 85 }] },
      { place: 'Supermarket Borongan', daysAgo: 45, items: [{ name: 'Gula Pasir Putih', unit: 'gram', qtyItems: 8000, net: 8000, pricePerItem: 18 }, { name: 'Susu UHT Full Cream', unit: 'ml', qtyItems: 12000, net: 12000, pricePerItem: 25 }, { name: 'Telur Ayam Negeri', unit: 'gram', qtyItems: 3000, net: 3000, pricePerItem: 3 }] },
      { place: 'Toko Bahan Kue', daysAgo: 38, items: [{ name: 'Tepung Terigu Protein Tinggi', unit: 'gram', qtyItems: 5000, net: 5000, pricePerItem: 12 }, { name: 'Mentega Tawar', unit: 'gram', qtyItems: 1000, net: 1000, pricePerItem: 45 }, { name: 'Keju Cream Cheese', unit: 'gram', qtyItems: 800, net: 800, pricePerItem: 60 }] },
      { place: 'Supplier Minuman', daysAgo: 30, items: [{ name: 'Susu Evaporasi', unit: 'ml', qtyItems: 3000, net: 3000, pricePerItem: 30 }, { name: 'Sirup Karamel', unit: 'ml', qtyItems: 1000, net: 1000, pricePerItem: 45 }, { name: 'Sirup Red Velvet', unit: 'ml', qtyItems: 1000, net: 1000, pricePerItem: 50 }] },
      { place: 'Supplier Boba & Topping', daysAgo: 25, items: [{ name: 'Boba Pearl (Instant)', unit: 'gram', qtyItems: 4000, net: 4000, pricePerItem: 35 }, { name: 'Jelly Powder (Grass)', unit: 'gram', qtyItems: 1500, net: 1500, pricePerItem: 40 }, { name: 'Cincau Hitam', unit: 'gram', qtyItems: 2000, net: 2000, pricePerItem: 15 }] },
      { place: 'Supermarket Borongan', daysAgo: 20, items: [{ name: 'Cup + Tutup 16oz', unit: 'pieces', qtyItems: 300, net: 300, pricePerItem: 500 }, { name: 'Cup + Tutup 22oz', unit: 'pieces', qtyItems: 200, net: 200, pricePerItem: 600 }, { name: 'Sedotan Biodegradable', unit: 'pieces', qtyItems: 500, net: 500, pricePerItem: 100 }] },
      { place: 'Distributor Es', daysAgo: 15, items: [{ name: 'Es Batu Kristal', unit: 'pieces', qtyItems: 500, net: 500, pricePerItem: 200 }] },
      { place: 'Supplier Matcha Indo', daysAgo: 10, items: [{ name: 'Matcha Powder (Reguler)', unit: 'gram', qtyItems: 3000, net: 3000, pricePerItem: 120 }, { name: 'Matcha Ice Cream Cup', unit: 'pieces', qtyItems: 80, net: 80, pricePerItem: 12500 }] },
      { place: 'Toko Plastik', daysAgo: 5, items: [{ name: 'Plastik Kemasan', unit: 'pieces', qtyItems: 200, net: 200, pricePerItem: 300 }] },
      { place: 'Supermarket Borongan', daysAgo: 2, items: [{ name: 'Susu UHT Low Fat', unit: 'ml', qtyItems: 5000, net: 5000, pricePerItem: 22 }, { name: 'Whipped Cream Cair', unit: 'ml', qtyItems: 1000, net: 1000, pricePerItem: 35 }, { name: 'Gula Merah', unit: 'gram', qtyItems: 3000, net: 3000, pricePerItem: 20 }] },
    ]
    for (const po of purchases) {
      const purchaseOrder = await prisma.purchaseOrder.create({ data: { place: po.place, userId: randomUserId(), createdAt: daysAgo(po.daysAgo) } })
      for (const it of po.items) {
        await prisma.purchaseItem.create({ data: { orderId: purchaseOrder.id, name: it.name, unit: it.unit, qtyItems: it.qtyItems, net: it.net, pricePerItem: it.pricePerItem, totalPrice: it.qtyItems * it.pricePerItem, createdAt: daysAgo(po.daysAgo) } })
      }
    }

    // --- STOCK LOGS ---
    const actions = ['restock', 'usage', 'usage', 'usage', 'restock', 'adjustment']
    for (let i = 0; i < 30; i++) {
      const stock = allStocks[Math.floor(Math.random() * allStocks.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const qty = Math.floor(Math.random() * 300) + 10
      await prisma.stockLog.create({
        data: { stockId: stock.id, action, quantity: qty, note: action === 'restock' ? 'Restok dari supplier' : action === 'usage' ? 'Pemakaian produksi' : 'Penyesuaian stok', userId: randomUserId(), createdAt: daysAgo(Math.floor(Math.random() * 60)) },
      })
    }

    // --- REGULAR NOTES ---
    const notes = [
      { title: 'Review Penjualan Juni', content: 'Penjualan bulan Juni naik 15% dibanding bulan lalu. Matcha Latte masih jadi menu favorit!', userId: kentId, daysAgo: 52 },
      { title: 'Ide Menu Baru', content: 'Coba bikin Matcha Tiramisu untuk menu bulan depan. Resep sudah dicoba di rumah, rasanya enak banget!', userId: kentId, daysAgo: 40 },
      { title: 'Ulasan Pelanggan', content: 'Banyak pelanggan request topping boba untuk menu Iced Matcha. Mungkin kita perlu add-on boba.', userId: joshuaId || kentId, daysAgo: 35 },
      { title: 'Jadwal Shift', content: 'Shift minggu ini: Joshua pagi (07-15), Jersy siang (15-23), Patricia weekend off. Laurencia libur Senin.', userId: jersyId || kentId, daysAgo: 28 },
      { title: 'Promo Spesial', content: 'Bundling Matcha Latte + Matcha Cookies hanya Rp35.000 (hemat Rp8.000). Berlaku weekdays jam 10-14.', userId: kentId, daysAgo: 22 },
      { title: 'Stok Oat Milk', content: 'Beberapa pelanggan nanya oat milk. Coba kita stock oat milk untuk alternatif non-dairy.', userId: patriciaId || kentId, daysAgo: 16 },
    ]
    for (const note of notes) {
      await prisma.note.create({ data: { title: note.title, content: note.content, authorId: note.userId, createdAt: daysAgo(note.daysAgo) } })
    }

    // --- METRIC NOTE ---
    await prisma.note.create({ data: { title: 'METRIC_TOTAL_PRODUCTS_SOLD', content: String(totalProductsSold), authorId: kentId } })

    // --- CALENDAR EVENTS ---
    const events = [
      { date: '2026-06-01', timeLabel: '09:00', time24: '09:00', title: 'Meeting Evaluasi Bulanan', location: 'Machazen', details: 'Review penjualan bulan Mei dan target Juni', userId: kentId },
      { date: '2026-06-15', timeLabel: '14:00', time24: '14:00', title: 'Taste Test Menu Baru', location: 'Machazen', details: 'Nyobain Matcha Tiramisu dan Red Velvet Matcha', userId: kentId },
      { date: '2026-07-01', timeLabel: '08:00', time24: '08:00', title: 'Stock Opname Akhir Bulan', location: 'Machazen', details: 'Hitung semua stok bahan baku', userId: randomUserId() },
      { date: '2026-07-05', timeLabel: '10:00', time24: '10:00', title: 'Supplier Visit', location: 'Machazen', details: 'Supplier Matcha Indo datang negosiasi harga', userId: kentId },
      { date: '2026-07-10', timeLabel: '16:00', time24: '16:00', title: 'Team Gathering', location: 'Machazen', details: 'Makan-makan bareng team setelah tutup', userId: kentId },
    ]
    for (const ev of events) {
      await prisma.calendarEvent.create({ data: ev })
    }

    res.json({
      message: 'Seed completed!',
      stats: {
        stocks: stockItems.length,
        recipes: recipes.length,
        salesOrders: '~200+ orders across 60 days',
        purchases: purchases.length,
        financeTx: financeTx.length,
        notes: notes.length,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
