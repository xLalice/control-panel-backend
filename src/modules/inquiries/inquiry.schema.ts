import { z } from "zod";
import {
  DeliveryMethod,
  ReferenceSource,
  InquiryStatus,
  InquiryType,
  Priority,
} from "@prisma/client";

const inquiryBaseSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  isCompany: z.boolean(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  productId: z.string(),
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

// Adding missing schema for updateDueDate
export const updateDueDateSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  dueDate: z.string().or(z.date()),
});

// Adding missing schema for assignInquiry
export const assignInquirySchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
  assigneeId: z.string().uuid("Invalid assignee ID format"),
  userId: z.string().uuid("Invalid user ID format"),
});

// Adding statistics type parameter to match getStatistics
export const statisticsFilterSchema = z.object({
  type: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
    .optional()
    .default("MONTHLY"),
});

export const filterInquirySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
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
    .enum(["id", "customerName", "status", "createdAt", "updatedAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  inquiryType: z.nativeEnum(InquiryType).optional(),
});

export const inquiryIdSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
});
