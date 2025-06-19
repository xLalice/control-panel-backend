import { PrismaClient, Category, PricingUnit, DeliveryMethod, ReferenceSource, Priority, Inquiry, InquiryType, InquiryStatus, LeadStatus, ContactHistory, ClientStatus, Report, Lead } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from "bcryptjs" 
import {Decimal} from "decimal.js"

const prisma = new PrismaClient();

function getRandomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array is empty, cannot get a random element.");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

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

  // Create Users
  const hashedPassword = await bcrypt.hash("12345678", 10); 

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id,
    }
  });
  
  console.log('Admin user created/updated.');

  // Create more users with different roles
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      password: hashedPassword, 
      name: 'Sales Rep',
      roleId: salesRole.id,
    }
  });
  

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: hashedPassword, 
      name: 'Manager User',
      roleId: managerRole.id,
    }
  });

  const ojtUser = await prisma.user.upsert({
    where: { email: 'ojt@example.com' },
    update: {},
    create: {
      email: 'ojt@example.com',
      password: hashedPassword, 
      name: 'OJT User',
      roleId: basicRole.id,
      isOJT: true,
      ojtStartDate: new Date('2025-01-01'),
      ojtEndDate: new Date('2025-04-30'),
    }
  });
  
  console.log('Additional users created/updated.');

  // Create allowed IPs for OJT user
  await prisma.allowedIP.upsert({
    where: { id: 'default-ip-1' },
    update: {},
    create: {
      id: 'default-ip-1',
      userId: ojtUser.id,
      ipAddress: '192.168.1.100',
      description: 'Office workstation',
    }
  });

  console.log('Allowed IPs created.');

  // Create DTR Settings
  await prisma.dTRSettings.upsert({
    where: { id: 'default-dtr-settings' },
    update: {},
    create: {
      id: 'default-dtr-settings',
      workStartTime: '08:00',
      lateThreshold: 15,
      allowRemoteLogin: false,
      autoRemindersActive: true,
      updatedById: adminUser.id,
    }
  });

  console.log('DTR Settings created.');

  // Create System Settings
  const systemSettings = [
    { key: 'company_name', value: 'Steel Supply Co.', description: 'Company name for reports and documents', updatedBy: adminUser.id },
    { key: 'company_address', value: '123 Industry Rd, Business District', description: 'Main office address', updatedBy: adminUser.id },
    { key: 'contact_email', value: 'info@steelsupplyco.example', description: 'Primary contact email', updatedBy: adminUser.id },
    { key: 'contact_phone', value: '+1 (555) 123-4567', description: 'Primary contact phone', updatedBy: adminUser.id },
    { key: 'default_quote_validity_days', value: '30', description: 'Default validity period for quotes in days', updatedBy: adminUser.id },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { 
        value: setting.value,
        updatedBy: setting.updatedBy
      },
      create: setting,
    });
  }

  console.log('System Settings created.');

  // Create Document Categories
  const documentCategories = [
    { name: 'Invoices', description: 'client invoices and billing documents' },
    { name: 'Quotes', description: 'Price quotes sent to clients' },
    { name: 'Contracts', description: 'Signed agreements and contracts' },
    { name: 'Marketing', description: 'Marketing materials and brochures' },
    { name: 'Technical', description: 'Product specifications and technical documents' },
  ];

  for (const category of documentCategories) {
    await prisma.documentCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
  }

  console.log('Document Categories created.');

  // Fetch document categories for later use
  const categories = await prisma.documentCategory.findMany();
  
  // Create sample documents
  const documents = [
    { 
      title: 'Sample Invoice Template', 
      filename: 'invoice_template.pdf',
      fileType: 'application/pdf',
      fileSize: 250000,
      filePath: '/uploads/invoice_template.pdf',
      uploadedById: adminUser.id,
      categoryId: categories.find(c => c.name === 'Invoices')?.id || 1,
    },
    { 
      title: 'Product Catalog 2024', 
      filename: 'catalog_2024.pdf',
      fileType: 'application/pdf',
      fileSize: 5000000,
      filePath: '/uploads/catalog_2024.pdf',
      uploadedById: salesUser.id,
      categoryId: categories.find(c => c.name === 'Marketing')?.id || 4,
    },
    { 
      title: 'Steel Grade Reference', 
      filename: 'steel_grades.xlsx',
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 350000,
      filePath: '/uploads/steel_grades.xlsx',
      uploadedById: adminUser.id,
      categoryId: categories.find(c => c.name === 'Technical')?.id || 5,
    },
  ];

  for (let i = 0; i < documents.length; i++) {
    await prisma.document.upsert({
      where: { id: i + 1 },
      update: documents[i],
      create: documents[i],
    });
  }

  console.log('Documents created.');

  // Create Companies
  const companies = [
    {
      id: faker.string.uuid(),
      name: 'Acme Construction Corp',
      industry: 'Construction',
      region: 'North',
      email: 'info@acmeconstruction.example',
      phone: '+1 (555) 987-6543',
      website: 'www.acmeconstruction.example',
      notes: 'Large construction company, regular buyer of steel',
      isActive: true,
    },
    {
      id: faker.string.uuid(),
      name: 'Metro Builders Inc',
      industry: 'Construction',
      region: 'Central',
      email: 'contact@metrobuilders.example',
      phone: '+1 (555) 456-7890',
      website: 'www.metrobuilders.example',
      notes: 'Medium-sized construction company focused on residential projects',
      isActive: true,
    },
    {
      id: faker.string.uuid(),
      name: 'Coastal Development LLC',
      industry: 'Real Estate Development',
      region: 'Coast',
      email: 'info@coastaldevelopment.example',
      phone: '+1 (555) 234-5678',
      website: 'www.coastaldevelopment.example',
      notes: 'Luxury development company with multiple high-rise projects',
      isActive: true,
    },
    {
      id: faker.string.uuid(),
      name: 'Industrial Fabrication Co',
      industry: 'Manufacturing',
      region: 'Industrial Zone',
      email: 'orders@indfab.example',
      phone: '+1 (555) 876-5432',
      website: 'www.indfab.example',
      notes: 'Metal fabrication shop, regular buyer of raw materials',
      isActive: true,
    },
    {
      id: faker.string.uuid(),
      name: 'Sunrise Contractors',
      industry: 'Construction',
      region: 'East',
      email: 'hello@sunrisecontractors.example',
      phone: '+1 (555) 345-6789',
      website: 'www.sunrisecontractors.example',
      notes: 'Small but growing contractors specializing in commercial buildings',
      isActive: true,
    },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { name: company.name },
      update: company,
      create: company,
    });
  }

  console.log('Companies created.');

  // Create Leads
  const leadStatuses = Object.values(LeadStatus);
  
  const leads: Lead[] = [];

  for (let i = 0; i < 20; i++) {
    const companyIndex = i % companies.length;
    const leadId = faker.string.uuid();

    leads.push({
      id: leadId,
      name: faker.company.name() + ' Lead - ' + faker.commerce.productName(),
      companyId: companies[companyIndex].id,
      contactPerson: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      status: (['New', 'Contacted', 'Qualified', 'ProposalSent', 'Negotiation', 'Won', 'Lost', 'Archived'] as const)[i % 8], // Cast to ensure correct string literal type
      source: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'LinkedIn'][i % 5],
      campaign: i % 3 === 0 ? 'Q1 2025 Campaign' : null,
      
      assignedToId: i % 3 === 0 ? salesUser.id : (i % 3 === 1 ? managerUser.id : null),
      createdById: i % 2 === 0 ? adminUser.id : salesUser.id,
      notes: faker.lorem.paragraph(),
      lastContactDate: i % 2 === 0 ? faker.date.recent({ days: 10 }) : null,
      followUpDate: i % 2 === 0 ? faker.date.soon({ days: 10 }) : null,
      estimatedValue: new Decimal(faker.number.float({ min: 5000, max: 100000 })),
      leadScore: faker.number.int({ min: 0, max: 100 }),
      referredBy: i % 5 === 0 ? 'Existing client' : null,
      isActive: true,
      createdAt: faker.date.past(), 
      originatingInquiryId: null,
      updatedAt: faker.date.recent(), 
    });
}

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: lead,
      create: lead,
    });
  }

  console.log('Leads created.');

  // Create Contact History for some leads
  const contactMethods = ['Call', 'Email', 'Meeting', 'Text', 'Video Call'];
  const contactHistories: ContactHistory[] = [];

  for (let i = 0; i < leads.length; i++) {
    // Add 1-3 contact history entries per lead
    const entryCount = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < entryCount; j++) {
      contactHistories.push({
              id: faker.string.uuid(),
              userId: salesUser.id, // Assign a valid userId
              leadId: leads[i].id,
              clientId: null, // Set to null if not applicable
              method: contactMethods[faker.number.int({ min: 0, max: contactMethods.length - 1 })],
              summary: faker.lorem.sentence(),
              outcome: ['Interested', 'Follow-up Scheduled', 'Not Interested', 'Left Message'][j % 4],
              timestamp: faker.date.recent({ days: 30 }),
            });
    }
  }

  for (const history of contactHistories) {
    await prisma.contactHistory.upsert({
      where: { id: history.id },
      update: history,
      create: history,
    });
  }

  console.log('Contact Histories created.');

  // Convert some leads to clients
  const clientStatuses = Object.values(ClientStatus);
  const clients: {
    id: string;
    companyId: string;
    clientName: string;
    accountNumber: string;
    primaryEmail: string;
    primaryPhone: string;
    billingAddressStreet: string;
    billingAddressCity: string;
    billingAddressRegion: string;
    billingAddressPostalCode: string;
    billingAddressCountry: string;
    shippingAddressStreet: string;
    shippingAddressCity: string;
    shippingAddressRegion: string;
    shippingAddressPostalCode: string;
    shippingAddressCountry: string;
    status: ClientStatus;
    notes: string;
    convertedFromLeadId: string;
    isActive: boolean;
  }[] = [];

  // Convert every 5th lead to a client
  for (let i = 0; i < leads.length; i += 5) {
    const clientId = faker.string.uuid();
    const lead = leads[i];
    
    clients.push({
      id: clientId,
      companyId: lead.companyId!,
      clientName: lead.contactPerson || lead.name,
      accountNumber: `ACC-${faker.number.int({ min: 10000, max: 99999 })}`,
      primaryEmail: lead.email,
      primaryPhone: lead.phone!,
      billingAddressStreet: faker.location.streetAddress(),
      billingAddressCity: faker.location.city(),
      billingAddressRegion: faker.location.state(),
      billingAddressPostalCode: faker.location.zipCode(),
      billingAddressCountry: 'United States',
      shippingAddressStreet: faker.location.streetAddress(),
      shippingAddressCity: faker.location.city(),
      shippingAddressRegion: faker.location.state(),
      shippingAddressPostalCode: faker.location.zipCode(),
      shippingAddressCountry: 'United States',
      status: clientStatuses[i % clientStatuses.length],
      notes: faker.lorem.paragraph(),
      convertedFromLeadId: lead.id,
      isActive: true,
    });

    // Update the original lead status to Won
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.Won }
    });
  }

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: client,
      create: client,
    });
  }

  console.log('clients created.');

  // Create contact history for clients
  for (const client of clients) {
    // Add 2-4 contact history entries per client
    const entryCount = faker.number.int({ min: 2, max: 4 });
    
    for (let j = 0; j < entryCount; j++) {
      await prisma.contactHistory.create({
        data: {
          id: faker.string.uuid(),
          clientId: client.id,
          leadId: null,
          userId: salesUser.id,
          method: contactMethods[faker.number.int({ min: 0, max: contactMethods.length - 1 })],
          summary: faker.lorem.sentence(),
          outcome: ['Order Placed', 'Support Provided', 'Feedback Collected', 'Upsell Attempt'][j % 4],
          timestamp: faker.date.recent({ days: 60 }),
        }
      });
    }
  }

  console.log('client Contact Histories created.');

  // Create activity logs for leads and clients
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    
    // Create 1-3 activity logs per lead
    const logCount = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < logCount; j++) {
      await prisma.activityLog.create({
        data: {
          id: faker.string.uuid(),
          leadId: lead.id,
          clientId: null,
          userId: lead.createdById,
          action: ['LeadCreated', 'LeadStatusChanged', 'LeadAssigned', 'NoteAdded'][j % 4],
          description: faker.lorem.sentence(),
          metadata: { 
            field: j % 4 === 1 ? 'status' : (j % 4 === 2 ? 'assignedTo' : 'notes'),
            old: j % 4 === 1 ? 'New' : (j % 4 === 2 ? null : ''),
            new: j % 4 === 1 ? 'Contacted' : (j % 4 === 2 ? lead.assignedToId : faker.lorem.sentence())
          },
          createdAt: faker.date.recent({ days: 30 }),
        }
      });
    }
  }

  // Create activity logs for clients
  for (const client of clients) {    
    // Create 2-4 activity logs per client
    const logCount = faker.number.int({ min: 2, max: 4 });
    
    for (let j = 0; j < logCount; j++) {
      await prisma.activityLog.create({
        data: {
          id: faker.string.uuid(),
          leadId: null,
          clientId: client.id,
          userId: adminUser.id,
          action: ['clientCreated', 'clientStatusChanged', 'AddressUpdated', 'NoteAdded'][j % 4],
          description: faker.lorem.sentence(),
          metadata: { 
            field: j % 4 === 1 ? 'status' : (j % 4 === 2 ? 'address' : 'notes'),
            old: j % 4 === 1 ? 'Active' : (j % 4 === 2 ? '123 Old St' : ''),
            new: j % 4 === 1 ? 'OnHold' : (j % 4 === 2 ? '456 New Ave' : faker.lorem.sentence())
          },
          createdAt: faker.date.recent({ days: 60 }),
        }
      });
    }
  }

  console.log('Activity Logs created.');

  // Create invoices for clients
  for (const client of clients) {
    // Create 2-5 invoices per client
    const invoiceCount = faker.number.int({ min: 2, max: 5 });
    
    for (let j = 0; j < invoiceCount; j++) {
      await prisma.invoice.create({
        data: {
          id: faker.string.uuid(),
          clientId: client.id,
        }
      });
    }
  }

  console.log('Invoices created.');

  // Create sales orders for clients
  for (const client of clients) {
    // Create 1-3 sales orders per client
    const orderCount = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < orderCount; j++) {
      await prisma.salesOrder.create({
        data: {
          id: faker.string.uuid(),
          clientId: client.id,
        }
      });
    }
  }

  console.log('Sales Orders created.');

  // Create Products (Aggregate, Heavy Equipment, Steel)
  // Create base products first
  const products = [
    // Aggregate products
    {
      id: faker.string.uuid(),
      category: Category.AGGREGATE,
      sku: 'AGG-001',
      name: 'Construction Sand - Fine',
      description: 'Fine grade sand for concrete mixing',
      basePrice: 35.50,
      pricingUnit: PricingUnit.TON,
      pricingDetails: { minOrder: 1, bulkDiscount: true },
      unit: 'ton',
      pickUpPrice: 30.00,
      deliveryPrice: 45.00,
      isActive: true,
      aggregateData: {
        source: 'Local Quarry',
        weightPerUnit: 1
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.AGGREGATE,
      sku: 'AGG-002',
      name: 'Crushed Stone - 3/4"',
      description: '3/4 inch crushed stone for drainage and base layers',
      basePrice: 42.75,
      pricingUnit: PricingUnit.TON,
      pricingDetails: { minOrder: 1, bulkDiscount: true },
      unit: 'ton',
      pickUpPrice: 38.00,
      deliveryPrice: 52.00,
      isActive: true,
      aggregateData: {
        source: 'Mountain Quarry',
        weightPerUnit: 1
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.HEAVY_EQUIPMENT,
      sku: 'HE-001',
      name: 'Excavator - 15 Ton',
      description: '15-ton excavator for medium construction projects',
      basePrice: 750.00,
      pricingUnit: PricingUnit.DAY,
      pricingDetails: { hoursPerDay: 8, overtime: 95.00 },
      unit: 'unit',
      pickUpPrice: null,
      deliveryPrice: 250.00,
      isActive: true,
      heavyEquipmentData: {
        equipmentType: 'Excavator'
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.HEAVY_EQUIPMENT,
      sku: 'HE-002',
      name: 'Bulldozer - D6',
      description: 'D6 bulldozer for grading and clearing',
      basePrice: 850.00,
      pricingUnit: PricingUnit.DAY,
      pricingDetails: { hoursPerDay: 8, overtime: 110.00 },
      unit: 'unit',
      pickUpPrice: null,
      deliveryPrice: 300.00,
      isActive: true,
      heavyEquipmentData: {
        equipmentType: 'Bulldozer'
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.HEAVY_EQUIPMENT,
      sku: 'HE-003',
      name: 'Crane - 40 Ton',
      description: '40-ton mobile crane for heavy lifting',
      basePrice: 1250.00,
      pricingUnit: PricingUnit.DAY,
      pricingDetails: { hoursPerDay: 8, overtime: 160.00 },
      unit: 'unit',
      pickUpPrice: null,
      deliveryPrice: 500.00,
      isActive: true,
      heavyEquipmentData: {
        equipmentType: 'Crane'
      }
    },
    // Steel products
    {
      id: faker.string.uuid(),
      category: Category.STEEL,
      sku: 'STL-001',
      name: 'Angle Bar - 2x2x1/4"',
      description: '2x2x1/4" steel angle bar, Grade A36',
      basePrice: 12.75,
      pricingUnit: PricingUnit.METER,
      pricingDetails: { lengthOptions: [6, 9, 12] },
      unit: 'piece',
      pickUpPrice: 12.75,
      deliveryPrice: 16.50,
      isActive: true,
      steelData: {
        grade: 'A36',
        length: '6m',
        type: 'Angle Bar',
        color: 'Silver',
        size: '2x2',
        additionalAttributes: { thickness: '1/4"' }
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.STEEL,
      sku: 'STL-002',
      name: 'GI Pipe - 2" Sch 40',
      description: '2-inch Schedule 40 Galvanized Steel Pipe',
      basePrice: 18.50,
      pricingUnit: PricingUnit.METER,
      pricingDetails: { lengthOptions: [6] },
      unit: 'piece',
      pickUpPrice: 18.50,
      deliveryPrice: 22.00,
      isActive: true,
      steelData: {
        grade: 'Standard',
        length: '6m',
        type: 'GI Pipe',
        color: 'Silver',
        size: '2-inch',
        additionalAttributes: { schedule: '40', wallThickness: '3.91mm' }
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.STEEL,
      sku: 'STL-003',
      name: 'I-Beam - 6x4"',
      description: '6x4 inch structural steel I-beam',
      basePrice: 45.25,
      pricingUnit: PricingUnit.METER,
      pricingDetails: { lengthOptions: [6, 9, 12] },
      unit: 'piece',
      pickUpPrice: 45.25,
      deliveryPrice: 60.00,
      isActive: true,
      steelData: {
        grade: 'A36',
        length: '6m',
        type: 'I-Beam',
        color: 'Silver',
        size: '6x4',
        additionalAttributes: { flange: '4-inch', web: '6-inch' }
      }
    },
    {
      id: faker.string.uuid(),
      category: Category.STEEL,
      sku: 'STL-004',
      name: 'Deformed Bar - 12mm Grade 60',
      description: '12mm diameter Grade 60 deformed steel rebar',
      basePrice: 8.25,
      pricingUnit: PricingUnit.METER,
      pricingDetails: { lengthOptions: [6, 9] },
      unit: 'piece',
      pickUpPrice: 8.25,
      deliveryPrice: 10.50,
      isActive: true,
      steelData: {
        grade: 'Grade 60',
        length: '9m',
        type: 'Deformed Bar',
        color: 'Silver',
        size: '12mm',
        additionalAttributes: { tensileStrength: '60,000 psi' }
      }
    }
  ];

  // Insert products with their specific type data
  for (const product of products) {
    const { aggregateData, heavyEquipmentData, steelData, ...baseProduct } = product;
    
    // Create the base product
    const createdProduct = await prisma.product.upsert({
      where: { id: baseProduct.id },
      update: baseProduct,
      create: baseProduct,
    });
    
    // Create the specific product type record
    if (aggregateData) {
      await prisma.aggregate.upsert({
        where: { productId: createdProduct.id },
        update: {
          source: aggregateData.source,
          weightPerUnit: aggregateData.weightPerUnit
        },
        create: {
          id: faker.string.uuid(),
          productId: createdProduct.id,
          source: aggregateData.source,
          weightPerUnit: aggregateData.weightPerUnit
        }
      });
    } else if (heavyEquipmentData) {
      await prisma.heavyEquipment.upsert({
        where: { productId: createdProduct.id },
        update: {
          equipmentType: heavyEquipmentData.equipmentType
        },
        create: {
          id: faker.string.uuid(),
          productId: createdProduct.id,
          equipmentType: heavyEquipmentData.equipmentType
        }
      });
    } else if (steelData) {
      await prisma.steel.upsert({
        where: { productId: createdProduct.id },
        update: {
          grade: steelData.grade,
          length: steelData.length,
          type: steelData.type,
          color: steelData.color,
          size: steelData.size,
          additionalAttributes: steelData.additionalAttributes
        },
        create: {
          id: faker.string.uuid(),
          productId: createdProduct.id,
          grade: steelData.grade,
          length: steelData.length,
          type: steelData.type,
          color: steelData.color,
          size: steelData.size,
          additionalAttributes: steelData.additionalAttributes
        }
      });
    }
  }

  console.log('Products created.');


  const allProductsId = (await prisma.product.findMany({ select: {id: true}}));
  // Create Inquiries
  const inquiryStatuses = Object.values(InquiryStatus);
  const inquiryTypes = Object.values(InquiryType);
  const deliveryMethods = Object.values(DeliveryMethod);
  const referenceSources = Object.values(ReferenceSource);
  const priorities = Object.values(Priority);
  
  const inquiries: Inquiry[] = [];

  const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 0; i < 15; i++) {
    const isCompanyInquiry = i % 3 === 0;
    const relatedLeadId = i % 5 === 0 ? leads[i % leads.length].id : null;
    const randomProduct = getRandomItem(products);

    inquiries.push({
          id: faker.string.uuid(),
          clientName: faker.person.fullName(),
          phoneNumber: faker.phone.number(),
          email: faker.internet.email(),
          isCompany: isCompanyInquiry,
          companyName: isCompanyInquiry ? companies[i % companies.length].name : null,
          companyAddress: isCompanyInquiry ? `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}` : null,
          inquiryType: inquiryTypes[i % inquiryTypes.length],
          deliveryMethod: deliveryMethods[i % deliveryMethods.length],
          deliveryLocation: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
          preferredDate: faker.date.soon({ days: 30 }),
          referenceSource: referenceSources[i % referenceSources.length],
          remarks: faker.lorem.paragraph(),
          status: inquiryStatuses[i % inquiryStatuses.length],
          priority: priorities[i % priorities.length],
          dueDate: faker.date.soon({ days: 15 }),
          leadId: relatedLeadId,
          createdById: i % 2 === 0 ? adminUser.id : salesUser.id,
          assignedToId: i % 3 === 0 ? salesUser.id : (i % 3 === 1 ? managerUser.id : null),
          createdAt: new Date(),
          updatedAt: new Date(),
          clientId: null
        });
  }

  for (const inquiry of inquiries) {
    await prisma.inquiry.upsert({
      where: { id: inquiry.id },
      update: inquiry,
      create: inquiry,
    });

    await prisma.inquiryItem.create({
      data: {
        inquiryId: inquiry.id,
        productId: getRandomElement(allProductsId).id,
        quantity: faker.number.int({ min: 1, max: 50 }),
        remarks: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      }
    })
  }

  console.log('Inquiries created.');

  // Create Reports
  const reports: Report[] = [];
  
  // Create 10 reports across different users
  for (let i = 0; i < 10; i++) {
    const reportUser = i % 3 === 0 ? adminUser : (i % 3 === 1 ? salesUser : managerUser);
    const reportDate = faker.date.recent({ days: 30 });
    
    reports.push({
      id: faker.string.uuid(),
      date: reportDate,
      reportedById: reportUser.id,
      location: i % 5 === 0 ? 'Office' : (i % 5 === 1 ? 'Field' : 'Remote'),
      taskDetails: faker.lorem.paragraph(),
      createdAt: new Date(),
    });
  }

  for (const report of reports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: report,
      create: report,
    });
  }

  console.log('Reports created.');

  // Create Attendance Records
  const attendanceStatuses = ['PRESENT', 'LATE', 'ON_BREAK', 'LOGGED_OUT'];
  const users = [adminUser, salesUser, managerUser, ojtUser];
  
  // Create 30 days of attendance records for each user
  for (let i = 0; i < 30; i++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = recordDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    for (const user of users) {
      // Randomize if this user has a record for this day (80% chance)
      if (faker.number.int({ min: 1, max: 10 }) <= 8) {
        const isLate = faker.number.int({ min: 1, max: 10 }) <= 2; // 20% chance of being late
        const timeIn = new Date(recordDate);
        timeIn.setHours(isLate ? 8 + faker.number.int({ min: 1, max: 2 }) : 8);
        timeIn.setMinutes(isLate ? faker.number.int({ min: 0, max: 59 }) : faker.number.int({ min: 0, max: 15 }));
        
        const timeOut = new Date(recordDate);
        timeOut.setHours(17 + faker.number.int({ min: 0, max: 2 }));
        timeOut.setMinutes(faker.number.int({ min: 0, max: 59 }));
        
        const totalHours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
        
        const attendanceId = faker.string.uuid();
        
        await prisma.attendance.upsert({
          where: { id: attendanceId },
          update: {
            userId: user.id,
            date: recordDate,
            timeIn: timeIn,
            timeOut: timeOut,
            status: isLate ? 'LATE' : 'PRESENT',
            totalHours: totalHours,
            ipAddress: faker.internet.ip(),
            device: ['Desktop', 'Laptop', 'Mobile'][faker.number.int({ min: 0, max: 2 })],
            notes: isLate ? 'Employee was late due to traffic' : null,
          },
          create: {
            id: attendanceId,
            userId: user.id,
            date: recordDate,
            timeIn: timeIn,
            timeOut: timeOut,
            status: isLate ? 'LATE' : 'PRESENT',
            totalHours: totalHours,
            ipAddress: faker.internet.ip(),
            device: ['Desktop', 'Laptop', 'Mobile'][faker.number.int({ min: 0, max: 2 })],
            notes: isLate ? 'Employee was late due to traffic' : null,
          },
        });
        
        // Add break logs (50% chance)
        if (faker.number.int({ min: 1, max: 10 }) <= 5) {
          const breakStart = new Date(recordDate);
          breakStart.setHours(12);
          breakStart.setMinutes(faker.number.int({ min: 0, max: 30 }));
          
          const breakEnd = new Date(recordDate);
          breakEnd.setHours(13);
          breakEnd.setMinutes(faker.number.int({ min: 0, max: 30 }));
          
          const breakDuration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
          
          await prisma.breakLog.create({
            data: {
              id: faker.string.uuid(),
              attendanceId: attendanceId,
              startTime: breakStart,
              endTime: breakEnd,
              duration: breakDuration,
              reason: 'Lunch break',
            }
          });
        }
      }
    }
  }

  console.log('Attendance Records created.');

  // Create a sample active session
  await prisma.session.upsert({
    where: { id: 'sample-session-id' },
    update: {
      sid: 'sample-session-sid',
      data: JSON.stringify({ userId: adminUser.id, username: adminUser.name }),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    },
    create: {
      id: 'sample-session-id',
      sid: 'sample-session-sid',
      data: JSON.stringify({ userId: adminUser.id, username: adminUser.name }),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    }
  });

  console.log('Session created.');

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