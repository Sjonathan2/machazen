const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

export default async function handler(req, res) {
  const user = getAuthFromCookie(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const id = Number(req.query.id)
  if (!id) return res.status(400).json({ error: 'ID invalid' })

  if (req.method === 'PUT') {
    const { name, price, ingredients = [] } = req.body || {}
    await prisma.recipe.update({ where: { id }, data: { name, price: Number(price) || 0 } })
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })
    for (const ing of ingredients) {
      if (!ing.stockId || Number(ing.qty) <= 0) continue
      await prisma.recipeIngredient.create({
        data: { recipeId: id, stockId: Number(ing.stockId), quantity: Number(ing.qty), unit: String(ing.unit || '') || null },
      })
    }
    const recipe = await prisma.recipe.findUnique({ where: { id } })
    const ings = await prisma.recipeIngredient.findMany({ where: { recipeId: id } })
    const detailed = await Promise.all(ings.map(async (ing) => {
      const stock = await prisma.stock.findUnique({ where: { id: ing.stockId } })
      return { stockId: ing.stockId, name: stock?.name || '', unit: ing.unit || stock?.unit || '-', qty: ing.quantity }
    }))
    return res.json({ id: recipe.id, name: recipe.name, price: recipe.price, ingredients: detailed })
  }

  if (req.method === 'DELETE') {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })
    await prisma.recipe.delete({ where: { id } })
    return res.json({ ok: true })
  }

  res.status(405).end()
}
