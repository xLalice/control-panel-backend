import { LeadStatus } from '@prisma/client';
import { z } from 'zod';

export const createLeadSchema = z.object({
  companyId: z.string().optional(), 
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
  subSource: z.string().optional(),
  campaign: z.string().optional(),
  assignedToId: z.string().optional(), 
  notes: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  industry: z.string().optional(),
  region: z.string().optional(),
  referredBy: z.string().optional(),
  followUpDate: z.string().transform((str) => new Date(str)).optional(),
  lastContactDate: z.string().transform((str) => new Date(str)).optional(),
  contactHistory: z.any().optional(), 
  status: z.enum(Object.values(LeadStatus) as [string, ...string[]]).optional().default("New"),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(Object.values(LeadStatus) as [string, ...string[]]).optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().transform((str) => new Date(str)).optional(),
  lastContactDate: z.string().transform((str) => new Date(str)).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(Object.values(LeadStatus) as [string, ...string[]]).optional(),
  notes: z.string().optional(),
  method: z.string().optional(),
});


export const assignLeadSchema = z.object({
  assignedToId: z.string().min(1, 'Assignee is required'),
  notes: z.string().optional(),
});

export const createActivityLogSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
  metadata: z.any().optional(),
  oldStatus: z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional(),
  newStatus: z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost']).optional(),
});
