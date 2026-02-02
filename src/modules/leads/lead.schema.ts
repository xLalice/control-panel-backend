import { LeadStatus } from '../../../prisma/generated/prisma/enums';
import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  companyId: z.string().optional(), 
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  source: z.string().optional(),
  assignedToId: z.string().optional(), 
  notes: z.string().optional(),
  estimatedValue: z.number().nullable().optional(),
  leadScore:  z.number().min(0).max(100).nullable().optional(),
  referredBy: z.string().optional(),
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
  status: z.nativeEnum(LeadStatus).optional(),
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
  oldStatus: z.nativeEnum(LeadStatus).optional(),
  newStatus: z.nativeEnum(LeadStatus).optional(),
});


export type CreateLeadDto = z.infer<typeof createLeadSchema>
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>
export type UpdateLeadStatusDto = z.infer<typeof updateLeadStatusSchema>
export type assignLeadSchema = z.infer<typeof assignLeadSchema>