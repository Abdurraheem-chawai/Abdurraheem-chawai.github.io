import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/products - Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - Create a new product
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, sku, barcode, price, sellingPrice, costPrice, categoryId, unit, supplierId } = req.body;

    const finalSellingPrice = sellingPrice ?? price;

    if (!name || !sku || finalSellingPrice === undefined || !categoryId) {
      return res.status(400).json({ error: 'Name, SKU, sellingPrice (or price), and categoryId are required' });
    }

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({ error: 'Product with this SKU already exists' });
    }

    // Prepare Prisma data object
    const productData: any = {
      name,
      sku,
      barcode: barcode || null,
      sellingPrice: Number(finalSellingPrice),
      costPrice: costPrice ? Number(costPrice) : null,
      unit: unit || 'pcs',
      category: {
        connect: { id: categoryId },
      },
    };

    // Only add supplier connection if supplierId is provided
    if (supplierId) {
      productData.supplier = {
        connect: { id: supplierId },
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: { category: true, supplier: true },
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error: any) {
    console.error('--- Product Creation Error ---', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  } 
});

export default router;