import {ReferenceSource, LeadStatus, InquiryType, Priority, DeliveryMethod } from "@prisma/client";

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

export interface CreateInquiryDto {
  clientName: string;
  phoneNumber: string;
  email: string;
  isCompany?: boolean; 
  companyName?: string;
  companyAddress?: string;
  product: string; 
  inquiryType: InquiryType; 
  quantity: number; 
  deliveryMethod?: DeliveryMethod;
  deliveryLocation?: string; 
  preferredDate: Date | string; 
  referenceSource: ReferenceSource; 
  status?: InquiryStatus;
  remarks?: string; 
  priority?: Priority; 
  dueDate?: Date | string; 
}

export interface ScheduleOptions {
  priority?: Priority;
  notes?: string;
  reminderMinutes?: number;
}

export type UpdateInquiryDto = Partial<CreateInquiryDto & {
   status?: InquiryStatus;
 }>

export type InquirySortField = "id" | "customerName" | "status" | "createdAt" | "updatedAt";



export interface InquiryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: ReferenceSource;
  productId?: string | null;
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