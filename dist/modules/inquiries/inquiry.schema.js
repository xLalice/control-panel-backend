"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryIdSchema = exports.filterInquirySchema = exports.statisticsFilterSchema = exports.assignInquirySchema = exports.updateDueDateSchema = exports.updatePrioritySchema = exports.rejectInquirySchema = exports.updateInquirySchema = exports.createInquirySchema = void 0;
const zod_1 = require("zod");
const inquiry_types_1 = require("./inquiry.types");
const client_1 = require("@prisma/client");
const inquiryBaseSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1, "Customer name is required"),
    phoneNumber: zod_1.z.string().min(1, "Phone number is required"),
    email: zod_1.z.string().email("Invalid email format"),
    isCompany: zod_1.z.boolean(),
    companyName: zod_1.z.string().optional(),
    companyAddress: zod_1.z.string().optional(),
    productType: zod_1.z.nativeEnum(inquiry_types_1.ProductType, {
        errorMap: () => ({ message: "Invalid product type" }),
    }),
    quantity: zod_1.z.number().int().positive("Quantity must be a positive number"),
    deliveryMethod: zod_1.z.nativeEnum(client_1.DeliveryMethod, {
        errorMap: () => ({ message: "Invalid delivery method" }),
    }),
    deliveryLocation: zod_1.z.string().optional(),
    preferredDate: zod_1.z.string().or(zod_1.z.date()),
    referenceSource: zod_1.z.nativeEnum(client_1.ReferenceSource, {
        errorMap: () => ({ message: "Invalid reference source" }),
    }),
    remarks: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).default(client_1.Priority.Low).optional(),
    dueDate: zod_1.z.date().optional(),
    inquiryType: zod_1.z.nativeEnum(client_1.InquiryType, {
        errorMap: () => ({ message: "Invalid inquiry type" }),
    })
});
exports.createInquirySchema = inquiryBaseSchema;
exports.updateInquirySchema = inquiryBaseSchema.partial().extend({
    status: zod_1.z
        .nativeEnum(client_1.InquiryStatus, {
        errorMap: () => ({ message: "Invalid status" }),
    })
        .optional(),
});
exports.rejectInquirySchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid inquiry ID format"),
    reason: zod_1.z.string().min(1, "Rejection reason is required"),
});
exports.updatePrioritySchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid inquiry ID format"),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
});
// Adding missing schema for updateDueDate
exports.updateDueDateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid inquiry ID format"),
    dueDate: zod_1.z.string().or(zod_1.z.date()),
});
// Adding missing schema for assignInquiry
exports.assignInquirySchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid inquiry ID format"),
    assigneeId: zod_1.z.string().uuid("Invalid assignee ID format"),
    userId: zod_1.z.string().uuid("Invalid user ID format"),
});
// Adding statistics type parameter to match getStatistics
exports.statisticsFilterSchema = zod_1.z.object({
    type: zod_1.z
        .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
        .optional()
        .default("MONTHLY"),
});
exports.filterInquirySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    status: zod_1.z
        .union([
        zod_1.z.nativeEnum(client_1.InquiryStatus, {
            errorMap: () => ({ message: "Invalid status" }),
        }),
        zod_1.z.literal("all"),
    ])
        .optional(),
    source: zod_1.z
        .union([
        zod_1.z.nativeEnum(client_1.ReferenceSource, {
            errorMap: () => ({ message: "Invalid source" }),
        }),
        zod_1.z.literal("all"),
    ])
        .optional(),
    productType: zod_1.z
        .union([
        zod_1.z.nativeEnum(inquiry_types_1.ProductType, {
            errorMap: () => ({ message: "Invalid product type" }),
        }),
        zod_1.z.literal("all"),
    ])
        .optional(),
    sortBy: zod_1.z
        .enum(["id", "customerName", "status", "createdAt", "updatedAt"])
        .optional()
        .default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
    search: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    inquiryType: zod_1.z.nativeEnum(client_1.InquiryType).optional(),
});
exports.inquiryIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid inquiry ID format"),
});
