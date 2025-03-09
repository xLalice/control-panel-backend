import { DeliveryMethod, ReferenceSource, LeadStatus } from "@prisma/client";

export enum InquiryStatus {
  New = "New",
  Processed = "InProgress", 
  Converted = "Converted",
  Closed = "Closed"
}


export enum ProductType {
  TypeA = "TypeA",
  TypeB = "TypeB",
  TypeC = "TypeC"
}

export type InquirySortField = "id" | "customerName" | "status" | "createdAt" | "updatedAt";



export interface Inquiry {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  isCompany: boolean;
  companyName?: string;
  companyAddress?: string;
  productType: string;
  quantity: number;
  deliveryMethod: DeliveryMethod;
  deliveryLocation: string;
  preferredDate: Date;
  referenceSource: ReferenceSource;
  remarks?: string;
  status: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  quotedPrice?: number;
  quotedBy?: string;
  quotedAt?: Date;
  
  relatedLeadId?: string;
  relatedLead?: any;
}

export interface CreateInquiryDto {
  customerName: string;
  phoneNumber: string;
  email: string;
  isCompany: boolean;
  companyName?: string;
  companyAddress?: string;
  productType: string;
  quantity: number;
  deliveryMethod: string;
  deliveryLocation?: string;
  preferredDate: string | Date;
  referenceSource: string;
  remarks?: string;
}

export interface UpdateInquiryDto {
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  isCompany?: boolean;
  companyName?: string;
  companyAddress?: string;
  productType?: string;
  quantity?: number;
  deliveryMethod?: string;
  deliveryLocation?: string;
  preferredDate?: string | Date;
  referenceSource?: string;
  remarks?: string;
  status?: string;
  quotedPrice?: number;
  relatedLeadId?: string;
}

export interface InquiryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: ReferenceSource;
  productType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  startDate?: string;
  endDate?: string;
}


export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InquiryStatistics {
  totalInquiries: number;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  bySource: Array<{
    source: string;
    count: number;
  }>;
  byProductType: Array<{
    productType: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: Date;
    count: number;
  }>;
  conversionRate: number;
}

export interface ConversionResult {
  lead: {
    id: string;
    status: LeadStatus;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    [key: string]: any;
  };
  company: {
    id: string;
    name: string;
    [key: string]: any;
  };
}

export interface QuoteDetails {
  basePrice: number;
  deliveryFee?: number;
  discount?: number;
  taxes?: number;
  totalPrice: number;
  validUntil?: Date;
  notes?: string;
}

// Response for customer existence check
export interface InquiryContactResponse {
  exists: boolean;
  lead: any | null;
  company: any | null;
}