import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/suppliers - Get all suppliers
router.get('/', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        products: true,
      },
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// POST /api/suppliers - Create a new supplier (Protected)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, companyName, contactPerson, email, phone, address } = req.body;

    const supplierCompanyName = companyName || name;

    if (!supplierCompanyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyName: supplierCompanyName,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (error: any) {
    console.error('--- Supplier Creation Error ---', error);
    res.status(500).json({ error: error.message || 'Failed to create supplier' });
  }
});

export default router;