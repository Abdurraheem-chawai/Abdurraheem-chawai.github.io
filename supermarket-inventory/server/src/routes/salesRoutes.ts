import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/sales - View full transaction history
router.get('/', async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: { product: true },
        },
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sales records' });
  }
});

// GET /api/sales/analytics/summary - High-level metrics
router.get('/analytics/summary', async (req: Request, res: Response) => {
  try {
    // 1. Total revenue & transaction count
    const totalSales = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // 2. Low stock alert count
    const lowStockItems = await prisma.inventory.findMany({
      include: { product: true, branch: true },
    });

    const lowStockAlerts = lowStockItems.filter(
      (item) => item.quantity <= item.product.reorderLevel
    );

    res.json({
      totalRevenue: totalSales._sum.totalAmount || 0,
      totalTransactions: totalSales._count.id || 0,
      lowStockCount: lowStockAlerts.length,
      lowStockAlerts: lowStockAlerts.map((i) => ({
        productName: i.product.name,
        branchName: i.branch.name,
        currentQuantity: i.quantity,
        reorderLevel: i.product.reorderLevel,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sales summary' });
  }
});

// GET /api/sales/analytics/top-products - Best-selling items by quantity
router.get('/analytics/top-products', async (req: Request, res: Response) => {
  try {
    const topItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Resolve product names for top items
    const detailedTopProducts = await Promise.all(
      topItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          totalQuantitySold: item._sum.quantity,
          totalRevenueGenerated: item._sum.subtotal,
        };
      })
    );

    res.json(detailedTopProducts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch top products' });
  }
});

// POST /api/sales/checkout - Process a new sale & deduct inventory
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { branchId, items, paymentMethod } = req.body;
    const userId = (req as any).user?.userId || "29735655-3ad7-4987-a0b7-98f7d5c9f949";

    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'branchId and a non-empty items array are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const { productId, quantity } = item;
        const qty = Number(quantity);

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        const inventory = await tx.inventory.findUnique({
          where: {
            productId_branchId: { productId, branchId },
          },
        });

        if (!inventory || inventory.quantity < qty) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${inventory?.quantity || 0}`);
        }

        await tx.inventory.update({
          where: {
            productId_branchId: { productId, branchId },
          },
          data: {
            quantity: { decrement: qty },
          },
        });

        const unitPrice = Number(product.sellingPrice);
        const subtotal = unitPrice * qty;
        totalAmount += subtotal;

        saleItemsData.push({
          productId,
          quantity: qty,
          unitPrice,
          subtotal,
        });
      }

      const saleRecord = await tx.sale.create({
        data: {
          branchId,
          userId: userId || null,
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
          branch: true,
        },
      });

      return saleRecord;
    });

    res.status(201).json({ message: 'Checkout completed successfully', sale: result });
  } catch (error: any) {
    console.error('--- POS Checkout Error ---', error);
    res.status(400).json({ error: error.message || 'Checkout failed' });
  }
});

// GET /api/sales/:id/receipt - Generate formatted thermal receipt payload
router.get('/:id/receipt', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        branch: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale transaction not found' });
    }

    // Format receipt structure
    const receipt = {
      storeInfo: {
        branchName: sale.branch.name,
        address: sale.branch.address || 'Standard Store Location',
        phone: sale.branch.phone || 'N/A',
      },
      receiptMeta: {
        receiptId: sale.id,
        cashier: sale.user ? `${sale.user.firstName || ''} ${sale.user.lastName || ''}`.trim() : 'System POS',
        date: sale.createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: sale.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        paymentMethod: sale.paymentMethod,
      },
items: sale.items.map((item: any) => ({
  productName: item.product.name,
  sku: item.product.sku,
  quantity: item.quantity,
  unitPrice: Number(item.unitPrice).toFixed(2),
  subtotal: Number(item.subtotal).toFixed(2),
})),
totals: {
  totalAmount: Number(sale.totalAmount).toFixed(2),
  itemCount: sale.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
},
      footerMessage: 'Thank you for shopping with us! Please keep this receipt for returns.',
    };

    res.json(receipt);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate receipt' });
  }
});
export default router;