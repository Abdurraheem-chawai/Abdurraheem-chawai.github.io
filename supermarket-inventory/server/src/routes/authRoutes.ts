import { Router, Request, Response } from 'express';
import { PrismaClient, RoleName } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register (Create initial Admin or User)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password, roleName, branchId } = req.body;

    if (!email || !password || !firstName || !lastName || !roleName) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName as RoleName } });
    if (!role) {
      return res.status(400).json({ error: `Role ${roleName} does not exist` });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        roleId: role.id,
        branchId: branchId || null,
      },
      include: { role: true, branch: true },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role.name,
      branchId: user.branchId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;