import { z } from "zod";
import {
  DeliveryMethod,
  ReferenceSource,
  InquiryStatus,
  InquiryType,
  Priority,
} from "@prisma/client";
import { string } from "zod/v4";

const inquiryBaseSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  isCompany: z.boolean(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  product: z.string(),
  status: z.nativeEnum(InquiryStatus).optional(),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  deliveryMethod: z.nativeEnum(DeliveryMethod, {
    errorMap: () => ({ message: "Invalid delivery method" }),
  }),
  deliveryLocation: z.string().optional(),
  preferredDate: z.date().or(z.string()),
  referenceSource: z.nativeEnum(ReferenceSource, {
    errorMap: () => ({ message: "Invalid reference source" }),
  }),
  remarks: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.Low).optional(),
  dueDate: z.date().optional(),
  inquiryType: z.nativeEnum(InquiryType, {
    errorMap: () => ({ message: "Invalid inquiry type" }),
  }),
});

export const createInquirySchema = inquiryBaseSchema;

export const updateInquirySchema = inquiryBaseSchema.partial().extend({
  status: z
    .nativeEnum(InquiryStatus, {
      errorMap: () => ({ message: "Invalid status" }),
    })
    .optional(),
});

export const rejectInquirySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  reason: z.string().min(1, "Rejection reason is required"),
});

export const updatePrioritySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const updateDueDateSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  dueDate: z.string().or(z.date()),
});

export const assignInquirySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  assignedToId: z.string().cuid("Invalid assignee ID format")
});

export const statisticsFilterSchema = z.object({
  type: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .default("MONTHLY"),
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
          "status",
          "product.name",
          "assignedTo.name",
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
  scheduledDate: z.string().datetime("Invalid date format for scheduled date. Expected ISO 8601 string."),
  priority: z.nativeEnum(Priority).optional(), 
  notes: z.string().optional(),
  reminderMinutes: z.number().int().min(0).optional(), 
});

export const  quoteSchema = z.object({
  basePrice: z.number().positive({ message: "Base price must be positive" }),
  totalPrice: z.number().positive({ message: "Total price must be positive" }),
});

export type ScheduleInquiryDTO = z.infer<typeof scheduleInquirySchema>
export type QuoteDTO = z.infer<typeof quoteSchema>
export type FilterInquiryInput = z.infer<typeof filterInquirySchema>


