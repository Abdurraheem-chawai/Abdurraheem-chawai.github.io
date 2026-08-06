import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products - Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        inventories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - Create a new product and initialize stock
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, sku, barcode, price, sellingPrice, costPrice, categoryId, initialStock } = req.body;

    const finalPrice = Number(sellingPrice ?? price ?? 0);

    if (!name || !sku || !finalPrice) {
      return res.status(400).json({ error: 'Name, SKU, and price are required' });
    }

    // Check SKU duplicate
    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }

    // Fallback Category if none passed
    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      const defaultCategory = await prisma.category.findFirst();
      if (defaultCategory) {
        targetCategoryId = defaultCategory.id;
      }
    }

    // Fallback Branch
    const defaultBranch = await prisma.branch.findFirst();
    const branchId = defaultBranch?.id || 'main-branch-uuid';

    // Create Product (Using sellingPrice, NOT price)
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode: barcode || null,
        sellingPrice: finalPrice,
        costPrice: costPrice ? Number(costPrice) : 0,
        ...(targetCategoryId ? { category: { connect: { id: targetCategoryId } } } : {}),
        inventories: {
          create: {
            branchId: branchId,
            quantity: Number(initialStock || 50),
          },
        },
      },
      include: {
        category: true,
        inventories: true,
      },
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error: any) {
    console.error('--- Product Creation Error ---', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

export default router;