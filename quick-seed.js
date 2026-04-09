const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString = "postgresql://postgres.yyrlmqvtedewjdpidtfl:1Two3four5!JLI@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissions = [
    { name: 'read:users', module: 'User Management' },
    { name: 'manage:users', module: 'User Management' },
    { name: 'read:roles', module: 'Role Management' },
    { name: 'manage:roles', module: 'Role Management' }, 
    { name: 'create:lead', module: 'Lead Management' },
    { name: 'read:own_leads', module: 'Lead Management' },
    { name: 'read:assigned_leads', module: 'Lead Management' },
    { name: 'read:all_leads', module: 'Lead Management' },
    { name: 'update:own_leads', module: 'Lead Management' },
    { name: 'update:assigned_leads', module: 'Lead Management' },
    { name: 'update:all_leads', module: 'Lead Management' },
    { name: 'delete:all_leads', module: 'Lead Management' },
    { name: 'assign:leads', module: 'Lead Management' },
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
    { name: 'create:report', module: 'Report Management' },
    { name: 'read:own_reports', module: 'Report Management' },
    { name: 'read:all_reports', module: 'Report Management' },
    { name: 'update:own_reports', module: 'Report Management' },
    { name: 'update:all_reports', module: 'Report Management' },
    { name: 'delete:all_reports', module: 'Report Management' },
    { name: 'read:products', module: 'Product Management' },
    { name: 'manage:products', module: 'Product Management' },
    { name: 'upload:document', module: 'Document Management' },
    { name: 'read:documents', module: 'Document Management' },
    { name: 'manage:documents', module: 'Document Management' },
    { name: 'create:quotation', module: 'Quotation Management' },
    { name: 'read:own_quotations', module: 'Quotation Management' },
    { name: 'read:assigned_quotations', module: 'Quotation Management' },
    { name: 'read:all_quotations', module: 'Quotation Management' },
    { name: 'update:own_quotations', module: 'Quotation Management' },
    { name: 'update:assigned_quotations', module: 'Quotation Management' },
    { name: 'update:all_quotations', module: 'Quotation Management' },
    { name: 'delete:all_quotations', module: 'Quotation Management' },
    { name: 'approve:quotation', module: 'Quotation Management' },
    { name: 'send:quotation', module: 'Quotation Management' },
    { name: 'convert:quotation_to_order', module: 'Quotation Management' },
    { name: 'log:attendance', module: 'Attendance Management' }, 
    { name: 'read:own_attendance', module: 'Attendance Management' },
    { name: 'read:all_attendance', module: 'Attendance Management' },
    { name: 'manage:attendance', module: 'Attendance Management' },
    { name: 'manage:dtr_settings', module: 'Attendance Management' },
    { name: 'manage:allowed_ips', module: 'Attendance Management' },
    { name: 'manage:system_settings', module: 'System Settings' },
    { name: 'read:companies', module: 'Company Management' },
    { name: 'manage:companies', module: 'Company Management' },
];

async function main() {
  console.log("Seeding permissions...");
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { module: p.module },
      create: {
        name: p.name,
        module: p.module,
      },
    });
  }

  console.log("Seeding Admin role...");
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

  // Ensure Admin role has all permissions even if it already existed
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: [],
        connect: permissions.map(p => ({ name: p.name })),
      }
    }
  });

  console.log("Seeding admin user...");
  const hashedPassword = await bcrypt.hash("12345678", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { 
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id,
    },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id,
    }
  });

  console.log("Admin user seeded: ", adminUser.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
