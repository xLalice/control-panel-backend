import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkInquiryStatus(inquiryId: string) {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        id: true,
        clientName: true,
        relatedLeadId: true, // This is the field you need to check
        status: true,
      },
    });

    if (inquiry) {
      console.log('Inquiry Found:');
      console.log('  ID:', inquiry.id);
      console.log('  Client Name:', inquiry.clientName);
      console.log('  Current Status:', inquiry.status);
      console.log('  relatedLeadId:', inquiry.relatedLeadId); // Check this value
      if (inquiry.relatedLeadId) {
        console.log(`This inquiry is ALREADY LINKED to lead ID: ${inquiry.relatedLeadId}`);
      } else {
        console.log('This inquiry is NOT YET LINKED to a lead.');
      }
    } else {
      console.log(`Inquiry with ID ${inquiryId} not found.`);
    }
  } catch (error) {
    console.error("Error checking inquiry status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Call the function with the problematic inquiry ID
checkInquiryStatus("773807af-7dc7-4653-b8b6-22b69973105b");