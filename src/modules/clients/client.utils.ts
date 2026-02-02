import { PrismaClient } from "../../../prisma/generated/prisma/client";

export async function generateNextAccountNumber(prisma: PrismaClient): Promise<string> {
  const lastClient = await prisma.client.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      accountNumber: true,
    },
    where: {
      accountNumber: {
        startsWith: 'CL-',
      },
    },
  });

  let nextNumber = 1;

  if (lastClient?.accountNumber) {
    const match = lastClient.accountNumber.match(/CL-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(6, '0');
  return `CL-${paddedNumber}`;
}
