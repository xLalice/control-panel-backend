import { LeadStatus } from "@prisma/client";

export interface SearchLeadsParams {
  search?: string;
  status?: LeadStatus;
  assignedTo?: string;
  name?: string;
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
    } | null;
    contactPerson: string | null;
    status: LeadStatus;
    assignedTo?: { name: string } | null;
    lastContactDate: Date | null;
    followUpDate: Date | null;
    leadScore: number | null;
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
