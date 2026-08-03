import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding baseline supermarket data...');

  // 1. Create Roles
  const roles = [
    { name: RoleName.ADMIN, permissions: ['ALL'] },
    { name: RoleName.MANAGER, permissions: ['MANAGE_PRODUCTS', 'VIEW_REPORTS', 'MANAGE_STOCK'] },
    { name: RoleName.CASHIER, permissions: ['POS_SALE', 'VIEW_PRODUCTS'] },
    { name: RoleName.INVENTORY_OFFICER, permissions: ['MANAGE_STOCK', 'RECEIVE_PO'] },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2. Create Main Branch
  const mainBranch = await prisma.branch.upsert({
    where: { id: 'main-branch-uuid' },
    update: {},
    create: {
      id: 'main-branch-uuid',
      name: 'Main Supermarket Branch',
      address: '123 Commerce St',
      phone: '+84900000000',
    },
  });

  // 3. Create Sample Categories
  const categories = ['Beverages', 'Snacks', 'Fresh Produce', 'Dairy', 'Household'];
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });