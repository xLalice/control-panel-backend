import { z } from "zod";
import {
  DeliveryMethod,
  ReferenceSource,
  InquiryStatus,
  InquiryType,
  Priority
} from "../../../prisma/generated/prisma/enums";
import { Prisma } from "../../../prisma/generated/prisma/client";


export const inquiryItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().int().positive("Quantity must be a positive number for an item"),
  remarks: z.string().optional().nullable(),
});

const inquiryBaseSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  isCompany: z.boolean(),
  companyName: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  deliveryMethod: z.nativeEnum(DeliveryMethod, {
    errorMap: () => ({ message: "Invalid delivery method" }),
  }),
  deliveryLocation: z.string().optional().nullable(),
  preferredDate: z.union([z.string().datetime(), z.date()])
    .transform((val) => typeof val === "string" ? new Date(val) : val)
    .optional()
    .nullable(),
  referenceSource: z.nativeEnum(ReferenceSource, {
    errorMap: () => ({ message: "Invalid reference source" }),
  }),
  remarks: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional().nullable(),
  dueDate: z.union([z.string().datetime(), z.date()])
    .transform((val) => typeof val === "string" ? new Date(val) : val)
    .optional()
    .nullable(),
  inquiryType: z.nativeEnum(InquiryType, {
    errorMap: () => ({ message: "Invalid inquiry type" }),
  }),
  status: z.nativeEnum(InquiryStatus).optional(),
});

export const createInquirySchema = inquiryBaseSchema.extend({
  items: z.array(inquiryItemSchema).min(1, "At least one product item is required for an inquiry"),
});
export type CreateInquiryDto = z.infer<typeof createInquirySchema>;


export const updateInquiryItemSchema = inquiryItemSchema.extend({
  id: z.string().uuid("Invalid inquiry item ID format").optional(),
});

export const updateInquirySchema = inquiryBaseSchema.partial().extend({
  items: z.array(updateInquiryItemSchema).optional(),
});
export type UpdateInquiryDto = z.infer<typeof updateInquirySchema>;

export type InquiryWithItemsAndProducts = Prisma.InquiryGetPayload<{
  include: {
    createdBy: true;
    assignedTo: true;
    lead: true;
    items: {
      include: {
        product: true;
      };
    };
  };
}>;



export const rejectInquirySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  reason: z.string().min(1, "Rejection reason is required"),
});

export const updatePrioritySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  priority: z.nativeEnum(Priority),
});

export const updateDueDateSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  dueDate: z.union([z.string().datetime(), z.date()])
    .transform((val) => typeof val === "string" ? new Date(val) : val),
});

export const assignInquirySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  assignedToId: z.string().cuid("Invalid assignee ID format"),
});

export const statisticsFilterSchema = z.object({
  type: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .default("MONTHLY"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const filterInquirySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page number cannot be negative")
    .default(1),

  limit: z.coerce.number().int().min(1, "Limit must be at least 1").default(10),
  status: z
    .union([
      z.nativeEnum(InquiryStatus, {
        errorMap: () => ({ message: "Invalid status" }),
      }),
      z.literal("all"),
    ])
    .optional(),
  source: z
    .union([
      z.nativeEnum(ReferenceSource, {
        errorMap: () => ({ message: "Invalid source" }),
      }),
      z.literal("all"),
    ])
    .optional(),
  productType: z.string().optional(),
  sortBy: z
    .string()
    .refine(
      (val) =>
        [
          "createdAt",
          "clientName",
          "status", "assignedTo.name",
        ].includes(val),
      "Invalid sortBy field"
    )
    .default("createdAt")
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  inquiryType: z.nativeEnum(InquiryType).optional(),
});

export const inquiryIdSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
});

export const scheduleInquirySchema = z.object({
  scheduledDate: z
    .string()
    .datetime(
      "Invalid date format for scheduled date. Expected ISO 8601 string."
    ),
  priority: z.nativeEnum(Priority).optional().nullable(),
  notes: z.string().optional().nullable(),
  reminderMinutes: z.number().int().min(0).optional().nullable(),
});

export const quoteSchema = z.object({
  basePrice: z.number().positive({ message: "Base price must be positive" }),
  totalPrice: z.number().positive({ message: "Total price must be positive" }),
});

export type ScheduleInquiryDTO = z.infer<typeof scheduleInquirySchema>;
export type QuoteDTO = z.infer<typeof quoteSchema>;
export type FilterInquiryInput = z.infer<typeof filterInquirySchema>;

const baseEntityIdSchema = z.string().min(1, "Entity ID is required.");

export const associateClientToInquirySchema = z.object({
  entityId: baseEntityIdSchema.uuid("Invalid client ID format (must be UUID)."),
});
export type AssociateClientToInquiryDto = z.infer<typeof associateClientToInquirySchema>;

export const associateLeadToInquirySchema = z.object({
  entityId: baseEntityIdSchema.cuid("Invalid lead ID format (must be CUID)."),
});
export type AssociateLeadToInquiryDto = z.infer<typeof associateLeadToInquirySchema>;

export const associateInquiryDataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("client"),
    entityId: baseEntityIdSchema.uuid("Invalid client ID format (must be UUID)."),
  }),
  z.object({
    type: z.literal("lead"),
    entityId: baseEntityIdSchema.uuid("Invalid lead ID format (must be UUID)."),
  }),
]);
export type AssociateInquiryDataDto = z.infer<typeof associateInquiryDataSchema>;
