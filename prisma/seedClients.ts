const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


 const clientData = [
  {
    clientName: "Acme Corporation",
    accountNumber: "ACC-001",
    primaryEmail: "contact@acmecorp.com",
    primaryPhone: "+1-555-0101",
    billingAddressStreet: "123 Business Ave",
    billingAddressCity: "New York",
    billingAddressRegion: "NY",
    billingAddressPostalCode: "10001",
    billingAddressCountry: "USA",
    shippingAddressStreet: "123 Business Ave",
    shippingAddressCity: "New York",
    shippingAddressRegion: "NY",
    shippingAddressPostalCode: "10001",
    shippingAddressCountry: "USA",
    status: "Active",
    notes: "Large enterprise client with multiple locations"
  },
  {
    clientName: "TechStart Solutions",
    accountNumber: "ACC-002",
    primaryEmail: "hello@techstart.io",
    primaryPhone: "+1-555-0102",
    billingAddressStreet: "456 Innovation Blvd",
    billingAddressCity: "San Francisco",
    billingAddressRegion: "CA",
    billingAddressPostalCode: "94105",
    billingAddressCountry: "USA",
    shippingAddressStreet: "789 Startup Lane",
    shippingAddressCity: "Palo Alto",
    shippingAddressRegion: "CA",
    shippingAddressPostalCode: "94301",
    shippingAddressCountry: "USA",
    status: "Active",
    notes: "Fast-growing tech startup"
  },
  {
    clientName: "Retail Chain Co",
    accountNumber: "ACC-004",
    primaryEmail: "buyers@retailchain.com",
    primaryPhone: "+1-555-0104",
    billingAddressStreet: "321 Commerce St",
    billingAddressCity: "Chicago",
    billingAddressRegion: "IL",
    billingAddressPostalCode: "60601",
    billingAddressCountry: "USA",
    shippingAddressStreet: "321 Commerce St",
    shippingAddressCity: "Chicago",
    shippingAddressRegion: "IL",
    shippingAddressPostalCode: "60601",
    shippingAddressCountry: "USA",
    status: "Inactive",
    notes: "Currently on hold due to restructuring"
  },
  {
    clientName: "Healthcare Partners LLC",
    accountNumber: "ACC-005",
    primaryEmail: "admin@healthpartners.org",
    primaryPhone: "+1-555-0105",
    billingAddressStreet: "555 Medical Center Dr",
    billingAddressCity: "Boston",
    billingAddressRegion: "MA",
    billingAddressPostalCode: "02101",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Healthcare organization with strict compliance requirements"
  },
  {
    clientName: "Educational Services Group",
    accountNumber: "ACC-006",
    primaryEmail: "procurement@eduservices.edu",
    primaryPhone: "+1-555-0106",
    billingAddressStreet: "100 Campus Way",
    billingAddressCity: "Austin",
    billingAddressRegion: "TX",
    billingAddressPostalCode: "78701",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Educational institution with budget cycles"
  },
  {
    clientName: "Financial Advisory Firm",
    accountNumber: "ACC-007",
    primaryEmail: "operations@finadvisory.com",
    primaryPhone: "+1-555-0107",
    billingAddressStreet: "200 Wall Street",
    billingAddressCity: "New York",
    billingAddressRegion: "NY",
    billingAddressPostalCode: "10005",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "High-value client with quarterly reviews"
  },
  {
    clientName: "Construction Works Ltd",
    accountNumber: "ACC-008",
    primaryEmail: "office@constructionworks.com",
    primaryPhone: "+1-555-0108",
    billingAddressStreet: "888 Builder Blvd",
    billingAddressCity: "Phoenix",
    billingAddressRegion: "AZ",
    billingAddressPostalCode: "85001",
    billingAddressCountry: "USA",
    shippingAddressStreet: "Various Job Sites",
    shippingAddressCity: "Phoenix",
    shippingAddressRegion: "AZ",
    shippingAddressPostalCode: "85001",
    shippingAddressCountry: "USA",
    status: "Active",
    notes: "Construction company with project-based orders"
  },
  {
    clientName: "Food Service Distributors",
    accountNumber: "ACC-009",
    primaryEmail: "orders@foodservice.com",
    primaryPhone: "+1-555-0109",
    billingAddressStreet: "777 Distribution Center",
    billingAddressCity: "Atlanta",
    billingAddressRegion: "GA",
    billingAddressPostalCode: "30301",
    billingAddressCountry: "USA",
    status: "OnHold",
    notes: "New client undergoing onboarding process"
  },
  {
    clientName: "Transportation Logistics",
    accountNumber: "ACC-010",
    primaryEmail: "dispatch@translogistics.com",
    primaryPhone: "+1-555-0110",
    billingAddressStreet: "999 Highway Hub",
    billingAddressCity: "Denver",
    billingAddressRegion: "CO",
    billingAddressPostalCode: "80201",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Logistics company with time-sensitive deliveries"
  },
  {
    clientName: "Green Energy Solutions",
    accountNumber: "ACC-011",
    primaryEmail: "info@greenenergy.com",
    primaryPhone: "+1-555-0111",
    billingAddressStreet: "111 Solar Street",
    billingAddressCity: "Portland",
    billingAddressRegion: "OR",
    billingAddressPostalCode: "97201",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Renewable energy company with government contracts"
  },
  {
    clientName: "Marketing Agency Plus",
    accountNumber: "ACC-012",
    primaryEmail: "accounts@marketingplus.com",
    primaryPhone: "+1-555-0112",
    billingAddressStreet: "222 Creative Ave",
    billingAddressCity: "Los Angeles",
    billingAddressRegion: "CA",
    billingAddressPostalCode: "90210",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Digital marketing agency serving SMBs"
  },
  {
    clientName: "Pharmaceutical Research Corp",
    accountNumber: "ACC-013",
    primaryEmail: "purchasing@pharmaresearch.com",
    primaryPhone: "+1-555-0113",
    billingAddressStreet: "333 Science Park",
    billingAddressCity: "Research Triangle",
    billingAddressRegion: "NC",
    billingAddressPostalCode: "27709",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Pharmaceutical company with specialized requirements"
  },
  {
    clientName: "Real Estate Holdings",
    accountNumber: "ACC-014",
    primaryEmail: "management@realestate.com",
    primaryPhone: "+1-555-0114",
    billingAddressStreet: "444 Property Plaza",
    billingAddressCity: "Miami",
    billingAddressRegion: "FL",
    billingAddressPostalCode: "33101",
    billingAddressCountry: "USA",
    status: "Inactive",
    notes: "Real estate firm with multiple properties"
  },
  {
    clientName: "Software Development House",
    accountNumber: "ACC-015",
    primaryEmail: "team@softwaredev.com",
    primaryPhone: "+1-555-0115",
    billingAddressStreet: "555 Code Canyon",
    billingAddressCity: "Seattle",
    billingAddressRegion: "WA",
    billingAddressPostalCode: "98101",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Custom software development company"
  },
  {
    clientName: "Insurance Brokers United",
    accountNumber: "ACC-016",
    primaryEmail: "office@insurancebrokers.com",
    primaryPhone: "+1-555-0116",
    billingAddressStreet: "666 Risk Avenue",
    billingAddressCity: "Hartford",
    billingAddressRegion: "CT",
    billingAddressPostalCode: "06101",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Insurance brokerage with corporate clients"
  },
  {
    clientName: "Entertainment Production Co",
    accountNumber: "ACC-017",
    primaryEmail: "production@entertainment.com",
    primaryPhone: "+1-555-0117",
    billingAddressStreet: "777 Studio Lot",
    billingAddressCity: "Hollywood",
    billingAddressRegion: "CA",
    billingAddressPostalCode: "90028",
    billingAddressCountry: "USA",
    status: "Inactive",
    notes: "Entertainment company with project-based work"
  },
  {
    clientName: "Agricultural Supplies Inc",
    accountNumber: "ACC-018",
    primaryEmail: "sales@agrisupplies.com",
    primaryPhone: "+1-555-0118",
    billingAddressStreet: "888 Farm Road",
    billingAddressCity: "Des Moines",
    billingAddressRegion: "IA",
    billingAddressPostalCode: "50301",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Agricultural supply company with seasonal patterns"
  },
  {
    clientName: "Consulting Professionals LLC",
    accountNumber: "ACC-019",
    primaryEmail: "partners@consultingpro.com",
    primaryPhone: "+1-555-0119",
    billingAddressStreet: "999 Strategy Street",
    billingAddressCity: "Washington",
    billingAddressRegion: "DC",
    billingAddressPostalCode: "20001",
    billingAddressCountry: "USA",
    status: "Active",
    notes: "Management consulting firm with Fortune 500 clients"
  },
  {
    clientName: "Hospitality Management Group",
    accountNumber: "ACC-020",
    primaryEmail: "operations@hospitalitygroup.com",
    primaryPhone: "+1-555-0120",
    billingAddressStreet: "101 Resort Boulevard",
    billingAddressCity: "Las Vegas",
    billingAddressRegion: "NV",
    billingAddressPostalCode: "89101",
    billingAddressCountry: "USA",
    shippingAddressStreet: "Multiple Hotel Locations",
    shippingAddressCity: "Las Vegas",
    shippingAddressRegion: "NV",
    shippingAddressPostalCode: "89101",
    shippingAddressCountry: "USA",
    status: "Active",
    notes: "Hotel and resort management company"
  }
];

async function seedClients() {
  try {
    console.log('Starting client seeding...');
    
    // First, let's check if we have any existing users, or create a sample user
    let sampleUserId;
    
    try {
      // Try to find an existing user
      const existingUser = await prisma.user.findFirst({where: {email: "admin@example.com"}});
      
      if (existingUser) {
        sampleUserId = existingUser.id;
        console.log(`✅ Using existing user: ${existingUser.id}`);
      } else {
        // Create a sample user if none exists
        const sampleUser = await prisma.user.create({
          data: {
            // Adjust these fields based on your User model schema
            email: "admin@example.com",
            name: "System Admin",
            // Add other required fields for your User model here
          }
        });
        sampleUserId = sampleUser.id;
        console.log(`✅ Created sample user: ${sampleUser.id}`);
      }
    } catch (userError) {
      console.log('⚠️  Could not create/find user. Skipping activity logs and contact history.');
      console.log('Please ensure you have a valid user in your database, or adjust the User creation fields.');
      sampleUserId = null;
    }
    
    // Create clients
    let acmeClientId = null;
    
    for (const client of clientData) {
      try {
        const upsertedClient = await prisma.client.upsert({
          where: { clientName: client.clientName },
          update: client,
          create: client
        });
        
        // Store Acme Corporation's ID for activity logs and contact history
        if (client.clientName === "Acme Corporation") {
          acmeClientId = upsertedClient.id;
        }
        
        console.log(`✅ Upserted client: ${client.clientName}`);
      } catch (error) {
        console.log(`⚠️  Skipped duplicate client: ${client.clientName}`);
      }
    }
    
    // Add Activity Logs for Acme Corporation
    if (acmeClientId && sampleUserId) {
      console.log('\n📝 Adding activity logs for Acme Corporation...');
      
      const activityLogs = [
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          action: "Client Created",
          description: "New client account created in the system",
          metadata: {
            accountNumber: "ACC-001",
            initialStatus: "Active"
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          action: "Status Update",
          description: "Client status verified and confirmed as Active",
          metadata: {
            field: "status",
            old: "Pending",
            new: "Active"
          },
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          action: "Contact Info Updated",
          description: "Primary contact email updated",
          metadata: {
            field: "primaryEmail",
            old: "info@acmecorp.com",
            new: "contact@acmecorp.com"
          },
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          action: "Notes Updated",
          description: "Added notes about client's multiple locations",
          metadata: {
            field: "notes",
            old: "Large enterprise client",
            new: "Large enterprise client with multiple locations"
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          action: "Account Review",
          description: "Quarterly account review completed",
          metadata: {
            reviewType: "quarterly",
            outcome: "positive",
            nextReviewDate: "2025-08-29"
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      ];
      
      for (const log of activityLogs) {
        await prisma.activityLog.create({
          data: log
        });
      }
      
      console.log(`✅ Added ${activityLogs.length} activity logs for Acme Corporation`);
      
      // Add Contact History for Acme Corporation
      console.log('\n📞 Adding contact history for Acme Corporation...');
      
      const contactHistory = [
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Email",
          summary: "Initial welcome email sent to new client",
          outcome: "Positive response received, client confirmed receipt",
          timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) // 28 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Call",
          summary: "Onboarding call to discuss account setup and requirements",
          outcome: "Successful call, gathered all necessary information for account setup",
          timestamp: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000) // 26 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Meeting",
          summary: "In-person meeting at client's NYC office to finalize contract terms",
          outcome: "Contract signed, payment terms agreed upon",
          timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) // 22 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Email",
          summary: "Sent monthly service update and performance metrics",
          outcome: "Client acknowledged receipt, requested additional reporting features",
          timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) // 18 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Call",
          summary: "Follow-up call regarding additional reporting requirements",
          outcome: "Requirements clarified, implementation scheduled for next sprint",
          timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000) // 16 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Email",
          summary: "Quarterly business review invitation sent",
          outcome: "Meeting scheduled for next week",
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Meeting",
          summary: "Quarterly business review - discussed performance, upcoming needs, and contract renewal",
          outcome: "Excellent review, client very satisfied, early renewal discussion initiated",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        {
          clientId: acmeClientId,
          userId: sampleUserId,
          method: "Email",
          summary: "Follow-up email with QBR action items and next steps",
          outcome: "Client confirmed understanding of all action items",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ];
      
      for (const contact of contactHistory) {
        await prisma.contactHistory.create({
          data: contact
        });
      }
      
      console.log(`✅ Added ${contactHistory.length} contact history entries for Acme Corporation`);
    } else if (!sampleUserId) {
      console.log('⚠️  Skipped activity logs and contact history - no valid user found');
    }
    
    console.log('\n✅ Successfully seeded 20 clients with enhanced data!');
    
    // Display summary
    const clientCount = await prisma.client.count();
    const activeCount = await prisma.client.count({ where: { status: 'Active' } });
    const inactiveCount = await prisma.client.count({ where: { status: 'Inactive' } });
    const activityLogCount = await prisma.activityLog.count();
    const contactHistoryCount = await prisma.contactHistory.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`Total Clients: ${clientCount}`);
    console.log(`Active: ${activeCount}`);
    console.log(`Inactive: ${inactiveCount}`);
    console.log(`Activity Logs: ${activityLogCount}`);
    console.log(`Contact History Entries: ${contactHistoryCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedClients(); 
