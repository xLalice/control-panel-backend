// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- Define Permissions ---
  const permissions = [
    // User Management
    { name: 'read:users', module: 'User Management' },
    { name: 'manage:users', module: 'User Management' }, // create, update, delete users

    // Role & Permission Management
    { name: 'read:roles', module: 'Role Management' },
    { name: 'manage:roles', module: 'Role Management' }, // create, update, delete roles + assign permissions

    // Lead Management
    { name: 'create:lead', module: 'Lead Management' },
    { name: 'read:own_leads', module: 'Lead Management' },
    { name: 'read:assigned_leads', module: 'Lead Management' },
    { name: 'read:all_leads', module: 'Lead Management' },
    { name: 'update:own_leads', module: 'Lead Management' },
    { name: 'update:assigned_leads', module: 'Lead Management' },
    { name: 'update:all_leads', module: 'Lead Management' },
    { name: 'delete:all_leads', module: 'Lead Management' },
    { name: 'assign:leads', module: 'Lead Management' },

    // Inquiry Management
    { name: 'create:inquiry', module: 'Inquiry Management' },
    { name: 'read:own_inquiries', module: 'Inquiry Management' },
    { name: 'read:assigned_inquiries', module: 'Inquiry Management' },
    { name: 'read:all_inquiries', module: 'Inquiry Management' },
    { name: 'update:own_inquiries', module: 'Inquiry Management' },
    { name: 'update:assigned_inquiries', module: 'Inquiry Management' },
    { name: 'update:all_inquiries', module: 'Inquiry Management' },
    { name: 'delete:all_inquiries', module: 'Inquiry Management' },
    { name: 'assign:inquiries', module: 'Inquiry Management' },
    { name: 'quote:inquiry', module: 'Inquiry Management' },

    // Report Management
    { name: 'create:report', module: 'Report Management' },
    { name: 'read:own_reports', module: 'Report Management' },
    { name: 'read:all_reports', module: 'Report Management' },
    { name: 'update:own_reports', module: 'Report Management' },
    { name: 'update:all_reports', module: 'Report Management' },
    { name: 'delete:all_reports', module: 'Report Management' },

    // Product Management
    { name: 'read:products', module: 'Product Management' },
    { name: 'manage:products', module: 'Product Management' }, // create, update, delete products

    // Document Management
    { name: 'upload:document', module: 'Document Management' },
    { name: 'read:documents', module: 'Document Management' },
    { name: 'manage:documents', module: 'Document Management' }, // update, delete documents

    // Attendance & DTR
    { name: 'log:attendance', module: 'Attendance Management' }, // User logs their own
    { name: 'read:own_attendance', module: 'Attendance Management' },
    { name: 'read:all_attendance', module: 'Attendance Management' },
    { name: 'manage:attendance', module: 'Attendance Management' }, // Correct/edit entries
    { name: 'manage:dtr_settings', module: 'Attendance Management' },
    { name: 'manage:allowed_ips', module: 'Attendance Management' },

    // System Settings
    { name: 'manage:system_settings', module: 'System Settings' },

    // Company Management
    { name: 'read:companies', module: 'Company Management' },
    { name: 'manage:companies', module: 'Company Management' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { module: p.module }, // Also update module if permission exists
      create: {
        name: p.name,
        module: p.module,
      },
    });
  }
  console.log('Permissions seeded.');

  
  const basicRole = await prisma.role.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      permissions: {
        connect: [
          { name: 'create:lead' },
          { name: 'read:own_leads' },
          { name: 'update:own_leads' },
          { name: 'create:inquiry' },
          { name: 'read:own_inquiries' },
          { name: 'update:own_inquiries' },
          { name: 'create:report' },
          { name: 'read:own_reports' },
          { name: 'update:own_reports' },
          { name: 'read:products' },
          { name: 'upload:document' },
          { name: 'read:documents' }, // Maybe only own? Needs logic adjustment
          { name: 'log:attendance' },
          { name: 'read:own_attendance' },
        ],
      },
    },
  });
  console.log('Basic Role created/updated.');

  // Role: Sales Representative
  const salesRole = await prisma.role.upsert({
    where: { name: 'Sales' },
    update: {},
    create: {
      name: 'Sales',
      permissions: {
        connect: [
          { name: 'create:lead' },
          { name: 'read:assigned_leads' },
          { name: 'update:assigned_leads' },
          { name: 'read:all_leads'}, // Or maybe just assigned + own
          { name: 'create:inquiry' },
          { name: 'read:assigned_inquiries' },
          { name: 'update:assigned_inquiries' },
          { name: 'read:all_inquiries'}, // Or maybe just assigned + own
          { name: 'quote:inquiry' },
          { name: 'create:report' },
          { name: 'read:own_reports' },
          { name: 'update:own_reports' },
          { name: 'read:products' },
          { name: 'upload:document' },
          { name: 'read:documents' },
          { name: 'log:attendance' },
          { name: 'read:own_attendance' },
          { name: 'read:companies'},
          { name: 'manage:companies'}, // Usually sales can create/update companies
        ],
      },
    },
  });
  console.log('Sales Role created/updated.');

  // Role: Manager
   const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      permissions: {
        connect: [
          { name: 'read:users' }, // Read users in their team potentially
          { name: 'create:lead' },
          { name: 'read:all_leads' },
          { name: 'update:all_leads' },
          // { name: 'delete:all_leads' }, // Maybe reserve delete for Admin
          { name: 'assign:leads' },
          { name: 'create:inquiry' },
          { name: 'read:all_inquiries' },
          { name: 'update:all_inquiries' },
          // { name: 'delete:all_inquiries' }, // Maybe reserve delete for Admin
          { name: 'assign:inquiries' },
          { name: 'quote:inquiry' },
          { name: 'create:report' },
          { name: 'read:all_reports' },
          { name: 'update:all_reports' },
          // { name: 'delete:all_reports' }, // Maybe reserve delete for Admin
          { name: 'read:products' },
          { name: 'upload:document' },
          { name: 'read:documents' },
          { name: 'log:attendance' }, // Can log their own
          { name: 'read:own_attendance' },
          { name: 'read:all_attendance' },
          { name: 'manage:attendance' }, // Can manage team attendance
          { name: 'manage:allowed_ips' }, // Can set IPs for team
          { name: 'read:companies'},
          { name: 'manage:companies'},
        ],
      },
    },
  });
  console.log('Manager Role created/updated.');


  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      permissions: {
        connect: permissions.map(p => ({ name: p.name })),
      },
    },
  });
  console.log('Admin Role created/updated.');


  const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
          email: 'admin@example.com',
          password: '12345678', 
          name: 'Admin User',
          roleId: adminRole.id,
      }
  });
  console.log('Admin user created/updated.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });