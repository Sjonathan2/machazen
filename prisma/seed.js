const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(7 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0)
  return d
}

async function main() {
  const passwordKent = await bcrypt.hash('machazen4life', 10)
  const passwordJoshua = await bcrypt.hash('12345678', 10)
  const passwordJersy = await bcrypt.hash('osmanthus wine', 10)
  const passwordPatricia = await bcrypt.hash('iluvmatcha', 10)
  const passwordLaurencia = await bcrypt.hash('ilovematchapolguys', 10)

  const users = []
  const userEmails = ['kent@machazen.id', 'bukanalden@gmail.com', 'jersy_istri@zhongli.com', 'leenciaaa@gmail.com', 'lauren@machazen.id']
  const userPasswords = [passwordKent, passwordJoshua, passwordJersy, passwordPatricia, passwordLaurencia]
  const userRoles = ['owner', 'pegawai', 'pegawai', 'pegawai', 'pegawai']

  for (let i = 0; i < userEmails.length; i++) {
    const u = await prisma.user.upsert({
      where: { email: userEmails[i] },
      update: {},
      create: { email: userEmails[i], password: userPasswords[i], role: userRoles[i] },
    })
    users.push(u)
  }

  const kentId = users[0].id
  const joshuaId = users[1].id
  const jersyId = users[2].id
  const patriciaId = users[3].id
  const laurenciaId = users[4].id
  const employeeIds = [joshuaId, jersyId, patriciaId, laurenciaId]

  function randomUserId() {
    return employeeIds[Math.floor(Math.random() * employeeIds.length)]
  }

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

  function stockByName(name) {
    return allStocks.find(s => s.name === name)
  }

  const recipes = [
    {
      name: 'Matcha Latte', price: 25000,
      description: 'Minuman matcha klasik dengan susu segar',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
        { stockName: 'Susu UHT', qty: 200, unit: 'ml' },
        { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
      ],
    },
    {
      name: 'Matcha Frappe', price: 30000,
      description: 'Matcha dingin blended dengan es krim',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
        { stockName: 'Susu UHT', qty: 150, unit: 'ml' },
        { stockName: 'Es Batu', qty: 5, unit: 'pieces' },
        { stockName: 'Krim Kocok', qty: 20, unit: 'gram' },
        { stockName: 'Sirup Gula', qty: 20, unit: 'ml' },
      ],
    },
    {
      name: 'Coklat Matcha', price: 28000,
      description: 'Perpaduan matcha dan coklat yang nikmat',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
        { stockName: 'Bubuk Coklat', qty: 10, unit: 'gram' },
        { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
        { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
      ],
    },
    {
      name: 'Matcha Boba', price: 32000,
      description: 'Matcha latte dengan topping boba kenyal',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
        { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
        { stockName: 'Boba Pearl (Kering)', qty: 40, unit: 'gram' },
        { stockName: 'Sirup Gula', qty: 25, unit: 'ml' },
      ],
    },
    {
      name: 'Vanilla Matcha', price: 27000,
      description: 'Matcha dengan sentuhan vanilla yang lembut',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
        { stockName: 'Bubuk Vanilla', qty: 5, unit: 'gram' },
        { stockName: 'Susu UHT', qty: 200, unit: 'ml' },
        { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
      ],
    },
    {
      name: 'Matcha Ice Cream Delight', price: 35000,
      description: 'Es krim matcha dengan whipped cream',
      ingredients: [
        { stockName: 'Matcha Ice Cream', qty: 2, unit: 'pieces' },
        { stockName: 'Krim Kocok', qty: 30, unit: 'gram' },
        { stockName: 'Matcha Powder', qty: 2, unit: 'gram' },
      ],
    },
    {
      name: 'Matcha Cookies', price: 15000,
      description: 'Kukis matcha homemade yang renyah',
      ingredients: [
        { stockName: 'Tepung Terigu', qty: 100, unit: 'gram' },
        { stockName: 'Gula Pasir', qty: 50, unit: 'gram' },
        { stockName: 'Matcha Powder', qty: 5, unit: 'gram' },
        { stockName: 'Mentega', qty: 40, unit: 'gram' },
        { stockName: 'Telur', qty: 25, unit: 'gram' },
      ],
    },
    {
      name: 'Matcha Cream Cheese', price: 30000,
      description: 'Matcha dengan cream cheese yang creamy',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
        { stockName: 'Keju Cream', qty: 30, unit: 'gram' },
        { stockName: 'Susu Full Cream', qty: 180, unit: 'ml' },
        { stockName: 'Sirup Gula', qty: 15, unit: 'ml' },
      ],
    },
    {
      name: 'Matcha Susu Kocok', price: 26000,
      description: 'Matcha dengan susu kocok lembut di atasnya',
      ingredients: [
        { stockName: 'Matcha Powder', qty: 3, unit: 'gram' },
        { stockName: 'Susu Full Cream', qty: 200, unit: 'ml' },
        { stockName: 'Krim Kocok', qty: 15, unit: 'gram' },
        { stockName: 'Sirup Gula', qty: 20, unit: 'ml' },
      ],
    },
    {
      name: 'Iced Matcha', price: 22000,
      description: 'Matcha segar dengan es batu',
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
    const recipe = await prisma.recipe.create({
      data: { name: r.name, price: r.price, description: r.description },
    })
    for (const ing of r.ingredients) {
      const stock = stockByName(ing.stockName)
      if (stock) {
        await prisma.recipeIngredient.create({
          data: { recipeId: recipe.id, stockId: stock.id, quantity: ing.qty, unit: ing.unit },
        })
      }
    }
    createdRecipes.push(recipe)
  }

  const customerNames = [
    'Budi Santoso', 'Siti Rahma', 'Andi Wijaya', 'Rina Amelia', 'Doni Prasetyo',
    'Maya Sari', 'Agus Hartono', 'Dewi Lestari', 'Hendra Gunawan', 'Lisa Permata',
    'Rizky Pratama', 'Nurul Hidayah', 'Bayu Saputra', 'Citra Dewi', 'Fajar Ramadhan',
    'Indah Kusuma', 'Kevin Tanujaya', 'Putri Ayu', 'Reza Pahlevi', 'Sari Indah',
    'Tono Wibisono', 'Vina Anggraini', 'Wahyu Nugroho', 'Yuni Astuti', 'Zaki Ahmad',
    'Ani Susanti', 'Bambang Suprayitno', 'Cindy Lim', 'Dimas Ardiansyah', 'Elsa Fitriana',
    'Farhan Kamil', 'Gita Permata Sari', 'Haris Munandar', 'Intan Permatasari',
  ]

  let totalProductsSold = 0

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    if (dayOffset === 0 && new Date().getHours() < 7) continue

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
      const userId = randomUserId()

      const order = await prisma.salesOrder.create({
        data: {
          customerName,
          total: orderTotal,
          paid,
          userId,
          createdAt: createdDate,
        },
      })

      for (const it of items) {
        await prisma.salesOrderItem.create({
          data: {
            orderId: order.id,
            recipeId: it.recipe.id,
            name: it.recipe.name,
            unit: 'pieces',
            price: it.recipe.price,
            quantity: it.qty,
            createdAt: createdDate,
          },
        })
        totalProductsSold += it.qty
      }
    }
  }

  const expenses = [
    { amount: 1500000, source: 'sewa', description: 'Sewa Tempat Bulanan', kind: 'beban', category: 'Sewa Tempat', method: 'Transfer', date: daysAgo(25) },
    { amount: 350000, source: 'listrik', description: 'Tagihan Listrik', kind: 'beban', category: 'Listrik & Air', method: 'Transfer', date: daysAgo(20) },
    { amount: 450000, source: 'gaji', description: 'Gaji Karyawan (Joshua)', kind: 'beban', category: 'Gaji Karyawan', method: 'Transfer', date: daysAgo(14) },
    { amount: 450000, source: 'gaji', description: 'Gaji Karyawan (Jersy)', kind: 'beban', category: 'Gaji Karyawan', method: 'Transfer', date: daysAgo(14) },
    { amount: 450000, source: 'gaji', description: 'Gaji Karyawan (Patricia)', kind: 'beban', category: 'Gaji Karyawan', method: 'Transfer', date: daysAgo(14) },
    { amount: 450000, source: 'gaji', description: 'Gaji Karyawan (Laurencia)', kind: 'beban', category: 'Gaji Karyawan', method: 'Transfer', date: daysAgo(14) },
    { amount: 200000, source: 'marketing', description: 'Iklan Instagram', kind: 'beban', category: 'Marketing', method: 'Transfer', date: daysAgo(10) },
    { amount: 150000, source: 'transportasi', description: 'Bensin Antar Pesanan', kind: 'beban', category: 'Transportasi', method: 'Cash', date: daysAgo(7) },
    { amount: 75000, source: 'perawatan', description: 'Servis Mesin', kind: 'beban', category: 'Perawatan', method: 'Cash', date: daysAgo(5) },
    { amount: 850000, source: 'bahan baku', description: 'Restock Matcha Powder from Supplier', kind: 'beban', category: 'Bahan Baku', method: 'Transfer', date: daysAgo(3) },
  ]

  for (const exp of expenses) {
    await prisma.note.create({
      data: {
        title: 'FINANCE_TX',
        content: JSON.stringify({
          type: 'expense',
          kind: exp.kind,
          amount: exp.amount,
          date: exp.date.toISOString(),
          description: exp.description,
          source: exp.source,
          category: exp.category,
          subCategory: null,
          method: exp.method,
        }),
        authorId: kentId,
        createdAt: exp.date,
      },
    })
  }

  // Income manual
  const manualIncomes = [
    { amount: 500000, source: 'cash', description: 'Pendapatan Catering Ultah', kind: 'pendapatan', category: 'Catering', method: 'Cash', date: daysAgo(12) },
    { amount: 250000, source: 'transfer', description: 'Pendapatan Delivery Order', kind: 'pendapatan', category: 'Delivery', method: 'Transfer', date: daysAgo(8) },
  ]

  for (const inc of manualIncomes) {
    await prisma.note.create({
      data: {
        title: 'FINANCE_TX',
        content: JSON.stringify({
          type: 'income',
          kind: inc.kind,
          amount: inc.amount,
          date: inc.date.toISOString(),
          description: inc.description,
          source: inc.source,
          category: inc.category,
          subCategory: null,
          method: inc.method,
        }),
        authorId: kentId,
        createdAt: inc.date,
      },
    })
  }

  const purchases = [
    { place: 'Supermarket Borongan', daysAgo: 29, items: [
      { name: 'Matcha Powder', unit: 'gram', qtyItems: 500, net: 500, pricePerItem: 150 },
      { name: 'Gula Pasir', unit: 'gram', qtyItems: 3000, net: 3000, pricePerItem: 18 },
    ]},
    { place: 'Toko Bahan Kue', daysAgo: 22, items: [
      { name: 'Tepung Terigu', unit: 'gram', qtyItems: 2000, net: 2000, pricePerItem: 12 },
      { name: 'Mentega', unit: 'gram', qtyItems: 500, net: 500, pricePerItem: 40 },
      { name: 'Telur', unit: 'gram', qtyItems: 1000, net: 1000, pricePerItem: 3 },
    ]},
    { place: 'Supplier Minuman', daysAgo: 15, items: [
      { name: 'Susu UHT', unit: 'ml', qtyItems: 6000, net: 6000, pricePerItem: 25 },
      { name: 'Susu Full Cream', unit: 'ml', qtyItems: 5000, net: 5000, pricePerItem: 28 },
      { name: 'Krim Kocok', unit: 'gram', qtyItems: 500, net: 500, pricePerItem: 4 },
    ]},
    { place: 'Supermarket Borongan', daysAgo: 8, items: [
      { name: 'Cup + Tutup', unit: 'pieces', qtyItems: 200, net: 200, pricePerItem: 500 },
      { name: 'Sedotan', unit: 'pieces', qtyItems: 300, net: 300, pricePerItem: 100 },
      { name: 'Plastik Kemasan', unit: 'pieces', qtyItems: 100, net: 100, pricePerItem: 300 },
    ]},
    { place: 'Toko Bahan Kue', daysAgo: 3, items: [
      { name: 'Matcha Ice Cream', unit: 'pieces', qtyItems: 50, net: 50, pricePerItem: 12000 },
      { name: 'Boba Pearl (Kering)', unit: 'gram', qtyItems: 2000, net: 2000, pricePerItem: 35 },
    ]},
    { place: 'Supplier Minuman', daysAgo: 1, items: [
      { name: 'Bubuk Coklat', unit: 'gram', qtyItems: 1000, net: 1000, pricePerItem: 80 },
      { name: 'Bubuk Vanilla', unit: 'gram', qtyItems: 500, net: 500, pricePerItem: 90 },
      { name: 'Sirup Gula', unit: 'ml', qtyItems: 2000, net: 2000, pricePerItem: 15 },
    ]},
  ]

  for (const po of purchases) {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: { place: po.place, userId: randomUserId(), createdAt: daysAgo(po.daysAgo) },
    })
    for (const it of po.items) {
      await prisma.purchaseItem.create({
        data: {
          orderId: purchaseOrder.id,
          name: it.name,
          unit: it.unit,
          qtyItems: it.qtyItems,
          net: it.net,
          pricePerItem: it.pricePerItem,
          totalPrice: it.qtyItems * it.pricePerItem,
          createdAt: daysAgo(po.daysAgo),
        },
      })
    }
  }

  const stockLogActions = ['restock', 'usage', 'adjustment', 'restock', 'usage', 'usage', 'restock']
  for (let i = 0; i < 20; i++) {
    const stock = allStocks[Math.floor(Math.random() * allStocks.length)]
    const action = stockLogActions[Math.floor(Math.random() * stockLogActions.length)]
    const qty = Math.floor(Math.random() * 200) + 10
    await prisma.stockLog.create({
      data: {
        stockId: stock.id,
        action,
        quantity: qty,
        note: action === 'restock' ? 'Restok dari supplier' : action === 'usage' ? 'Pemakaian produksi' : 'Penyesuaian stok',
        userId: randomUserId(),
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    })
  }

  const regularNotes = [
    { title: 'Ide Menu Baru', content: 'Coba bikin Matcha Tiramisu untuk menu bulan depan. Resep sudah dicoba di rumah rasanya enak!', userId: kentId, daysAgo: 27 },
    { title: 'Review Pelanggan', content: 'Pelanggan bilang Matcha Boba nya kurang manis. Mungkin perlu tambah takaran sirup jadi 30ml.', userId: joshuaId, daysAgo: 20 },
    { title: 'Jadwal Shift', content: 'Shift bulan ini: Joshua pagi (07-15), Jersy siang (15-23), Patricia weekend off', userId: jersyId, daysAgo: 18 },
    { title: 'Promosi', content: 'Bikin promo "Beli 2 Gratis 1" untuk menu Matcha Latte dan Iced Matcha. Berlaku weekdays jam 10-14.', userId: kentId, daysAgo: 12 },
    { title: 'Inventaris', content: 'Cup ukuran 16oz hampir habis. Perlu order 2 dus dari supplier minggu depan.', userId: patriciaId, daysAgo: 9 },
    { title: 'Musik', content: 'Playlist spotify untuk cafe: https://open.spotify.com/playlist/example - chill lo-fi vibes', userId: laurenciaId, daysAgo: 6 },
    { title: 'Resep Baru', content: 'Matcha Red Velvet Latte: tambah bubuk red velvet 5g, kurangi matcha jadi 1.5g. Harga jual 30k.', userId: joshuaId, daysAgo: 4 },
    { title: 'Meeting', content: 'Rapat evaluasi bulanan hari Sabtu jam 10 pagi. Bahas target penjualan dan menu baru.', userId: kentId, daysAgo: 2 },
  ]

  for (const note of regularNotes) {
    await prisma.note.create({
      data: { title: note.title, content: note.content, authorId: note.userId, createdAt: daysAgo(note.daysAgo) },
    })
  }

  await prisma.note.create({
    data: { title: 'METRIC_TOTAL_PRODUCTS_SOLD', content: String(totalProductsSold), authorId: kentId },
  })

  // --- CALENDAR EVENTS ---
  const calendarEvents = [
    { date: formatDate(daysAgo(28)), timeLabel: '10:00', time24: '10:00', title: 'Supplier Datang', location: 'Machazen', details: 'Negosiasi harga bahan baku bulan depan', userId: kentId },
    { date: formatDate(daysAgo(21)), timeLabel: '14:00', time24: '14:00', title: 'Meeting Tim', location: 'Machazen', details: 'Evaluasi performa menu baru', userId: joshuaId },
    { date: formatDate(daysAgo(14)), timeLabel: '09:00', time24: '09:00', title: 'Servis AC', location: 'Machazen', details: 'Teknisi datang servis AC rutin', userId: patriciaId },
    { date: formatDate(daysAgo(7)), timeLabel: '16:00', time24: '16:00', title: 'Taste Test', location: 'Machazen', details: 'Nyobain resep Matcha Tiramisu bareng tim', userId: jersyId },
    { date: formatDate(daysAgo(0)), timeLabel: '08:00', time24: '08:00', title: 'Stock Opname', location: 'Machazen', details: 'Hitung stok akhir bulan', userId: laurenciaId },
  ]

  for (const ev of calendarEvents) {
    await prisma.calendarEvent.create({ data: ev })
  }

  console.log('Seed data created successfully!')
  console.log(`  - ${users.length} users`)
  console.log(`  - ${allStocks.length} stock items`)
  console.log(`  - ${createdRecipes.length} recipes`)
  console.log(`  - Sales orders across 30 days`)
  console.log(`  - ${purchases.length} purchase orders`)
  console.log(`  - ${regularNotes.length} notes`)
  console.log(`  - ${expenses.length + manualIncomes.length} finance transactions`)
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
