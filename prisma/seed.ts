const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First, create the companies
  const companies = [
    {
      name: "CRAFTSMEN DEVELOPMENT & CONSTRUCTION CORPORATION",
      region: "NCR (National Capital Region)",
      industry: "General Building / General Engineering",
      phone: "729-5950"
    },
    {
      name: "HI-TECH GROUP INC.",
      region: "NCR (National Capital Region)",
      industry: "General Building",
      phone: "463-02-60"
    },
    {
      name: "A.C. MOJARES CONSTRUCTION INC.",
      region: "NCR (National Capital Region)",
      industry: "General Engineering",
      email: "inquiry@acmojaresconstruction.com.ph",
      phone: "961-3048"
    },
    {
      name: "A.L. SALAZAR CONSTRUCTION INC.",
      region: "NCR (National Capital Region)",
      industry: "General Engineering",
      email: "info@alsci-ph.com",
      phone: "725-4310"
    },
    {
      name: "AARCON BUILDERS",
      region: "NCR (National Capital Region)",
      industry: "General Engineering",
      phone: "(632)441-8225"
    },
    {
      name: "ABADA CONSTRUCTION AND SUPPLY",
      region: "Region XIII - Caraga",
      industry: "General Engineering",
      phone: "(085) 300 0957"
    },
    {
      name: "ACCELERATED METAL TECHNOLOGY & CONSTRUCTION INC.",
      region: "NCR (National Capital Region)",
      industry: "General Building",
      phone: "(02)951-25-26"
    },
    {
      name: "ACTUATE BUILDERS INC.",
      region: "NCR (National Capital Region)",
      industry: "General Building",
      phone: "631-0091"
    },
    {
      name: "ADVANCED FOUNDATION CONSTRUCTION SYSTEMS CORP.",
      region: "NCR (National Capital Region)",
      industry: "General Engineering",
      email: "afcsc@pldtdsl.net",
      phone: "886-34-38"
    }
  ];

  // Create all companies
  for (const company of companies) {
    await prisma.company.create({
      data: company
    });
  }
  
  console.log("Companies created successfully!");

  // Get the creator user ID (you'll need to replace this with an actual user ID from your database)
  // For example, get the first admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" } // Assuming you have a role field in your User model
  });

  if (!adminUser) {
    throw new Error("No admin user found to assign as creator");
  }

  // Get all the companies we just created to reference in leads
  const createdCompanies = await prisma.company.findMany();

  // Now create leads for each company
  for (const company of createdCompanies) {
    // Extract contact person info from the original data
    let contactPerson = null;
    let source = "Database Import";
    let notes = "";
    
    // Match contact person based on company name
    if (company.name === "CRAFTSMEN DEVELOPMENT & CONSTRUCTION CORPORATION") {
      contactPerson = "Elmer Diaz Garcia";
      notes = "Specializes in Road, Highway, Pavement, Railways, Airport Horizontal Structures and Bridges";
    } else if (company.name === "HI-TECH GROUP INC.") {
      contactPerson = "Cesario Castro Reyes";
      notes = "Multiple specializations including Small B Irrigation and Flood Control";
    } else if (company.name === "A.C. MOJARES CONSTRUCTION INC.") {
      contactPerson = "Alejandro C. Mojares";
      source = "Email Inquiry";
    } else if (company.name === "A.L. SALAZAR CONSTRUCTION INC.") {
      contactPerson = "Emmanuel B. Zalazar";
      notes = "Family-owned domestic corporation, focusing on buildings, roads, bridges, and other structure-related projects";
    } else if (company.name === "AARCON BUILDERS") {
      contactPerson = "Arnold A. Reyes";
      notes = "Medium A classification in Road/Highway and Building/Industrial Plant";
    } else if (company.name === "ABADA CONSTRUCTION AND SUPPLY") {
      contactPerson = "Anthony Galve Abada";
      notes = "Small B classification across multiple categories";
    } else if (company.name === "ACCELERATED METAL TECHNOLOGY & CONSTRUCTION INC.") {
      contactPerson = "Antonio Managuelod Tumolva";
      notes = "Medium A classification in multiple categories";
    } else if (company.name === "ACTUATE BUILDERS INC.") {
      contactPerson = "Alexander Verzosa Floro";
      notes = "Specialty in Electrical, Mechanical, and Fire Protection Work";
    } else if (company.name === "ADVANCED FOUNDATION CONSTRUCTION SYSTEMS CORP.") {
      contactPerson = "Joel Salazar Arceo";
      notes = "Large B classification in Foundation Work and Road/Highway";
    }

    // Create lead for the company
    await prisma.lead.create({
      data: {
        companyId: company.id,
        contactPerson: contactPerson,
        email: company.email,
        phone: company.phone,
        status: "New",
        source: source,
        subSource: "Government Registry",
        createdById: adminUser.id,
        notes: notes,
        industry: company.industry,
        region: company.region,
        estimatedValue: Math.random() * 100000, 
        leadScore: Math.random() * 100, 
      }
    });
  }

  console.log("Leads created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });