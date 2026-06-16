const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const recipes = await prisma.recipe.findMany({ orderBy: { id: 'desc' }, take: 100 })
    const enriched = await Promise.all(recipes.map(async (r) => {
      const ings = await prisma.recipeIngredient.findMany({ where: { recipeId: r.id } })
      const detailed = await Promise.all(ings.map(async (ing) => {
        const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
        return { stockId: ing.stockId, name: stock?.name || '', unit: ing.unit || stock?.unit || '-', qty: ing.quantity }
      }))
      return { id: r.id, name: r.name, price: r.price, ingredients: detailed }
    }))
    return res.json(enriched)
  }

  if (req.method === 'POST') {
    const { name, price, ingredients = [] } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Nama produk wajib diisi' })

    const recipe = await prisma.recipe.create({ data: { name, price: Number(price) || 0 } })
    for (const ing of ingredients) {
      if (!ing.stockId || Number(ing.qty) <= 0) continue
      await prisma.recipeIngredient.create({
        data: { recipeId: recipe.id, stockId: Number(ing.stockId), quantity: Number(ing.qty), unit: String(ing.unit || '') || null },
      })
    }

    const ings = await prisma.recipeIngredient.findMany({ where: { recipeId: recipe.id } })
    const countRecipes = await prisma.recipe.count()
    if (countRecipes > 100) {
      const oldest = await prisma.recipe.findFirst({ orderBy: { createdAt: 'asc' } })
      if (oldest) {
        await prisma.recipeIngredient.deleteMany({ where: { recipeId: oldest.id } })
        await prisma.recipe.delete({ where: { id: oldest.id } })
      }
    }
    const detailed = await Promise.all(ings.map(async (ing) => {
      const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
      return { stockId: ing.stockId, name: stock?.name || '', unit: ing.unit || stock?.unit || '-', qty: ing.quantity }
    }))
    return res.json({ id: recipe.id, name: recipe.name, price: recipe.price, ingredients: detailed })
  }

  res.status(405).end()
}
