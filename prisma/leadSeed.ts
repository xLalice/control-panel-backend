// src/scripts/seed-from-excel.ts
import { PrismaClient, LeadStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

interface ExcelRow {
  "Company Name": string;
  Region: string;
  Category: string;
  Address: string;
  "Authorized Managing Officer": string;
  "Designation/Position": string;
  "Contact Number": string;
  Email: string;
  Type: string;
  Class: string;
}

async function main() {
  console.log("Starting database seeding from Excel...");

  // Load Excel file
  const workbook = XLSX.readFile(
    path.resolve(__dirname, "../data/book1.xlsx")
  );
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

  console.log(`Found ${data.length} records in Excel file`);

  // Track companies to avoid duplicates
  const companyMap = new Map<string, string>();

  for (const row of data) {
    try {
      // Extract and normalize company data
      const companyName = row["Company Name"]?.trim();
      if (!companyName) continue;

      // Skip if we've already processed this company
      if (companyMap.has(companyName)) {
        continue;
      }

      // Determine industry from Category or Type
      const industry = row["Category"] || row["Type"] || "Construction";

      // Create company record
      const company = await prisma.company.create({
        data: {
          name: companyName,
          industry: industry,
          region: row["Region"] || null,
          email:
            row["Email"]?.includes("@") &&
            !row["Email"]?.includes("gmail.com") &&
            !row["Email"]?.includes("yahoo.com")
              ? row["Email"]
              : null,
          phone: extractPhoneNumber(row["Contact Number"]),
        },
      });

      // Store company ID for reference
      companyMap.set(companyName, company.id);

      // Create lead record for the contact person
      if (row["Authorized Managing Officer"]) {
        await prisma.lead.create({
          data: {
            companyId: company.id,
            contactPerson: row["Authorized Managing Officer"]?.trim() || null,
            email: row["Email"] || null,
            phone: extractPhoneNumber(row["Contact Number"]),
            status: LeadStatus.New,
            source: "Excel Import",
            industry: industry,
            region: row["Region"] || null,
            estimatedValue: calculateEstimatedValue(row["Type"], row["Class"]),
          },
        });
      }

      console.log(`Processed: ${companyName}`);
    } catch (error) {
      console.error(`Error processing row for ${row["Company Name"]}:`, error);
    }
  }

  const companyCount = await prisma.company.count();
  const leadCount = await prisma.lead.count();

  console.log(`Seeding completed successfully!`);
  console.log(`Created ${companyCount} companies and ${leadCount} leads`);
}

function extractPhoneNumber(contactField: string): string | null {
  if (!contactField) return null;

  // Extract digits only
  const digits = contactField.replace(/\D/g, "");

  // If we have a reasonable phone number length
  if (digits.length >= 7) {
    return digits;
  }

  return null;
}

function calculateEstimatedValue(
  type: string,
  classification: string
): number | null {
  // Default value tiers based on company type and classification
  if (type === "Corporation") {
    if (classification === "General") return 100000;
    return 75000;
  } else if (type === "Sole Proprietorship") {
    return 50000;
  }

  return null;
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
