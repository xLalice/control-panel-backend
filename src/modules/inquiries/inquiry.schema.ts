import { z } from "zod";

import { ProductType } from "./inquiry.types";
import { DeliveryMethod, ReferenceSource, InquiryStatus } from "@prisma/client";

const inquiryBaseSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  isCompany: z.boolean(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  productType: z.nativeEnum(ProductType, {
    errorMap: () => ({ message: "Invalid product type" }),
  }),
  quantity: z.number().int().positive("Quantity must be a positive number"),
  deliveryMethod: z.nativeEnum(DeliveryMethod, {
    errorMap: () => ({ message: "Invalid delivery method" }),
  }),
  deliveryLocation: z.string().optional(),
  preferredDate: z.string().or(z.date()),
  referenceSource: z.nativeEnum(ReferenceSource, {
    errorMap: () => ({ message: "Invalid reference source" }),
  }),
  remarks: z.string().optional(),
});

export const createInquirySchema = inquiryBaseSchema;

export const updateInquirySchema = inquiryBaseSchema.partial().extend({
  status: z.nativeEnum(InquiryStatus, {
    errorMap: () => ({ message: "Invalid status" }),
  }).optional(),
});

export const filterInquirySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  status: z.union([
    z.nativeEnum(InquiryStatus, {
      errorMap: () => ({ message: "Invalid status" }),
    }),
    z.literal("all")
  ]).optional(),
  source: z.union([
    z.nativeEnum(ReferenceSource, {
      errorMap: () => ({ message: "Invalid source" }),
    }),
    z.literal("all")
  ]).optional(),
  productType: z.union([
    z.nativeEnum(ProductType, {
      errorMap: () => ({ message: "Invalid product type" }),
    }),
    z.literal("all")
  ]).optional(),
  sortBy: z.enum(["id", "customerName", "status", "createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const inquiryIdSchema = z.object({
  id: z.string().uuid("Invalid inquiry ID format"),
});