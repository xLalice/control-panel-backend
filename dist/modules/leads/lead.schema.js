"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivityLogSchema = exports.assignLeadSchema = exports.updateLeadStatusSchema = exports.updateLeadSchema = exports.createLeadSchema = void 0;
const zod_1 = require("zod");
exports.createLeadSchema = zod_1.z.object({
    companyId: zod_1.z.string().optional(),
    companyName: zod_1.z.string().optional(),
    contactPerson: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email address').optional(),
    phone: zod_1.z.string().optional(),
    source: zod_1.z.string().min(1, 'Source is required'),
    subSource: zod_1.z.string().optional(),
    campaign: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    estimatedValue: zod_1.z.number().positive().optional(),
    leadScore: zod_1.z.number().min(0).max(100).optional(),
    industry: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    referredBy: zod_1.z.string().optional(),
    followUpDate: zod_1.z.string().transform((str) => new Date(str)).optional(),
    lastContactDate: zod_1.z.string().transform((str) => new Date(str)).optional(),
    contactHistory: zod_1.z.any().optional(), // JSON field
    status: zod_1.z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional().default("New"),
});
exports.updateLeadSchema = exports.createLeadSchema.partial().extend({
    status: zod_1.z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional(),
    assignedToId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    followUpDate: zod_1.z.string().transform((str) => new Date(str)).optional(),
    lastContactDate: zod_1.z.string().transform((str) => new Date(str)).optional(),
});
exports.updateLeadStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']),
    notes: zod_1.z.string().optional(),
    method: zod_1.z.string().optional(),
});
exports.assignLeadSchema = zod_1.z.object({
    assignedToId: zod_1.z.string().min(1, 'Assignee is required'),
    notes: zod_1.z.string().optional(),
});
exports.createActivityLogSchema = zod_1.z.object({
    leadId: zod_1.z.string().min(1, 'Lead ID is required'),
    userId: zod_1.z.string().min(1, 'User ID is required'),
    action: zod_1.z.string().min(1, 'Action is required'),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.any().optional(),
    oldStatus: zod_1.z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional(),
    newStatus: zod_1.z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional(),
});
