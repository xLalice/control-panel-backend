import { Prisma } from "../../../prisma/generated/prisma/client";

export function getSortingConfig(
  sortBy: string,
  sortOrder: "asc" | "desc"
): Prisma.LeadOrderByWithRelationInput {
  switch (sortBy) {
    case "companyName":
      return {
        company: {
          name: sortOrder,
        },
      };
    case "assignedTo":
      return {
        assignedTo: {
          name: sortOrder,
        },
      };
    case "contactPerson":
    case "status":
    case "lastContactDate":
    case "followUpDate":
    case "leadScore":
    case "industry":
    case "region":
      return {
        [sortBy]: sortOrder,
      };
    default:
      return {
        createdAt: "desc",
      };
  }
}
