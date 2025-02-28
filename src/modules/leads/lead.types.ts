import { Lead, LeadStatus, Company, ActivityLog } from "@prisma/client";

export interface CreateLeadDto {
  companyId?: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  source: string;
  subSource?: string;
  campaign?: string;
  industry?: string;
  region?: string;
  referredBy?: string;
  estimatedValue?: number;
  followUpDate?: Date;
  notes?: string;
  status: LeadStatus;
  assignedToId?: string;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  status?: LeadStatus;
  assignedToId?: string;
  leadScore?: number;
  lastContactDate?: Date;
}

export interface UpdateLeadStatusDto {
  status: LeadStatus;
  notes?: string;
  method?: string;
}

export interface SearchLeadsParams {
  search?: string;
  status?: LeadStatus;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedLeadsResponse {
  leads: {
    id: string;
    company: {
      name: string;
      email: string | null;
      phone: string | null;
    };
    contactPerson: string | null;
    status: LeadStatus; 
    assignedTo?: { name: string } | null;
    lastContactDate: Date | null;
    followUpDate: Date | null;
    leadScore: number | null;
    industry: string | null;
    region: string | null;
  }[];
  total: number;
}


export interface ActivityLogDto {
  id: string;
  leadId: string;
  userId: string;
  action: "status_change" | "note_added" | "assignment" | "update" | "contact";
  description: string;
  metadata?: Record<string, any>;
  oldStatus?: LeadStatus;
  newStatus?: LeadStatus;
  createdAt: Date;
}

export interface AssignLeadDto {
  assignedToId: string;
  notes?: string;
}
