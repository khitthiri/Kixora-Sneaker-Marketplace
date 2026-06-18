const router = require('express').Router();
const prisma = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { search, brand, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { colorway: { contains: search, mode: 'insensitive' } }];
    if (brand) where.brand = { slug: brand };
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: parseInt(limit), include: { brand: true }, orderBy: { name: 'asc' } }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, data: { products, pagination: { page: parseInt(page), total } } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { brand: true, priceHistory: { orderBy: { recordedAt: 'desc' }, take: 50 } },
    });
    if (!product) return res.status(404).json({ success: false, error: { message: 'Product not found' } });
    res.json({ success: true, data: { product } });
  } catch (err) { next(err); }
});

module.exports = router;
