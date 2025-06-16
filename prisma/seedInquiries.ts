import {
  PrismaClient,
  InquiryStatus,
  DeliveryMethod,
  ReferenceSource,
  Priority,
  InquiryType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seedInquiries() {
  console.log("Seeding inquiries...");

  // --- Fetch existing IDs for relations ---
  const users = await prisma.user.findMany({ select: { id: true } });
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });
  const leads = await prisma.lead.findMany({ select: { id: true } });

  if (users.length === 0) {
    console.warn("No users found. Please seed users first.");
    return;
  }
  if (products.length === 0) {
    console.warn("No products found. Please seed products first.");
    return;
  }
  // Leads are optional for inquiries, so no warning needed if empty

  const userIds = users.map((user) => user.id);
  const productIds = products.map((product) => product.id);
  const leadIds = leads.map((lead) => lead.id);

  const inquiryStatuses = Object.values(InquiryStatus);
  const deliveryMethods = Object.values(DeliveryMethod);
  const referenceSources = Object.values(ReferenceSource);
  const priorities = Object.values(Priority);
  const inquiryTypes = Object.values(InquiryType);

  const numberOfInquiries = 100; // You can adjust this number

  for (let i = 0; i < numberOfInquiries; i++) {
    const isCompany = faker.datatype.boolean(0.5); // 50% chance of being a company
    const clientName = isCompany
      ? faker.company.name()
      : faker.person.fullName();
    const email = faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      provider: faker.helpers.arrayElement([
        "example.com",
        "mail.com",
        "biz.org",
      ]),
    });
    const phoneNumber = faker.phone.number({ style: "human" });

    const createdById = faker.helpers.arrayElement(userIds);
    const assignableUserIds: (string | null)[] = [...userIds, null, null];
    const assignedToId = faker.helpers.arrayElement(assignableUserIds);

    const productId = faker.helpers.arrayElement(productIds);

    const assignableLeadIds: (string | null)[] = [...leadIds, null, null, null, null]; // Higher chance of no related lead
    const relatedLeadId = faker.helpers.arrayElement(assignableLeadIds);

    const preferredDate = faker.date.soon({ days: 30 }); // Inquiries usually have a near-future preferred date
    const createdAt = faker.date.recent({ days: 90 }); // Created within the last 90 days
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    const status = faker.helpers.arrayElement(inquiryStatuses);
    const assignablePriorities: (Priority | null)[] = [...priorities, null]; // Priority can be null
    const priority = faker.helpers.arrayElement(assignablePriorities);

    const dueDate = faker.datatype.boolean(0.7) ? faker.date.future({ years: 1, refDate: preferredDate }) : null; // Most inquiries have a due date, but can be null

    const quoted = faker.datatype.boolean(0.4);

    try {
      await prisma.inquiry.create({
        data: {
          clientName: clientName,
          phoneNumber: phoneNumber,
          email: email,
          isCompany: isCompany,
          companyName: isCompany ? faker.company.name() : null,
          companyAddress: isCompany ? faker.location.streetAddress(true) : null,
          productId: productId,
          inquiryType: faker.helpers.arrayElement(inquiryTypes),
          quantity: faker.number.int({ min: 1, max: 500 }),
          deliveryMethod: faker.helpers.arrayElement(deliveryMethods),
          deliveryLocation: faker.location.streetAddress(true), // Always provide a location for simplicity
          preferredDate: preferredDate,
          referenceSource: faker.helpers.arrayElement(referenceSources),
          remarks: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null, 
          status: status,
          priority: priority,
          dueDate: dueDate,
          quotedPrice: quoted
            ? faker.number.float({ min: 100, max: 50000, fractionDigits: 2 })
            : null,
          quotedBy: quoted ? faker.helpers.arrayElement(userIds) : null,
          quotedAt: quoted
            ? faker.date.between({ from: createdAt, to: new Date() })
            : null,
          relatedLeadId: relatedLeadId,
          createdById: createdById,
          assignedToId: assignedToId,
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
      });
      process.stdout.write("."); // Indicate progress
    } catch (error) {
      console.error(`\nError creating inquiry ${i + 1}:`, error);
    }
  }

  console.log(`\nSeeded ${numberOfInquiries} inquiries.`);
}

async function main() {
  try {
    await seedInquiries();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
