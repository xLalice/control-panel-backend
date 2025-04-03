import {ReferenceSource, LeadStatus, InquiryType, Priority } from "@prisma/client";

export enum InquiryStatus {
  New = "New",
  Processed = "InProgress", 
  Converted = "Converted",
  Closed = "Closed"
}

export enum InquiryTypeEnum {
  PricingRequest = "PricingRequest",
  ProductAvailability = "ProductAvailability",
  TechnicalQuestion = "TechnicalQuestion",
  DeliveryInquiry = "DeliveryInquiry",
  Other = "Other"
}

export enum ProductType {
  AGGREGATE = "AGGREGATE",
  HEAVY_EQUIPMENT = "HEAVY_EQUIPMENT",
  STEEL = "STEEL"
}

export type InquirySortField = "id" | "customerName" | "status" | "createdAt" | "updatedAt";


export interface CreateInquiryDto {
  customerName: string;
  phoneNumber: string;
  email: string;
  isCompany: boolean;
  companyName?: string;
  companyAddress?: string;
  productType: ProductType;
  quantity: number;
  deliveryMethod: string;
  deliveryLocation?: string;
  preferredDate: string | Date;
  referenceSource: string;
  remarks?: string;
  inquiryType?: InquiryType;
  priority?: Priority;
  dueDate?: Date;
}

export interface UpdateInquiryDto {
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  isCompany?: boolean;
  companyName?: string;
  companyAddress?: string;
  productType?: ProductType;
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
  productType?: ProductType | "all" | undefined;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  startDate?: string;
  endDate?: string;
  inquiryType?: InquiryType
  priority?: Priority
  dueDate?: Date
  assignedToId?: string
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

export interface  InquiryStatistics {
  totalInquiries: number; 
  byStatus: Array<{ status: string | null; count: number }>; 
  bySource: Array<{ source: string | null; count: number }>; 
  byProductType: Array<{ productType: string | null; count: number }>; 
  monthlyTrends: Array<{ month: Date; count: number }>; 
  conversionRate: number;
}

export type MonthlyDataRaw = {
  month: Date;
  count: bigint; 
};

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