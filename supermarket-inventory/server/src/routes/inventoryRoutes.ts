import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/inventory - Get current inventory levels across branches
router.get('/', async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
        branch: true,
      },
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory/stock-in - Add or update stock for a product at a branch
router.post('/stock-in', async (req: Request, res: Response) => {
  try {
    const { productId, branchId, quantity } = req.body;

    if (!productId || !branchId || quantity === undefined) {
      return res.status(400).json({ error: 'productId, branchId, and quantity are required' });
    }

    const addedQty = Number(quantity);

    // Upsert inventory record
    const inventory = await prisma.inventory.upsert({
      where: {
        productId_branchId: {
          productId,
          branchId,
        },
      },
      update: {
        quantity: {
          increment: addedQty,
        },
      },
      create: {
        productId,
        branchId,
        quantity: addedQty,
      },
      include: {
        product: true,
        branch: true,
      },
    });

    res.status(200).json({ message: 'Stock updated successfully', inventory });
  } catch (error: any) {
    console.error('--- Inventory Update Error ---', error);
    res.status(500).json({ error: error.message || 'Failed to update stock' });
  }
});

export default router;