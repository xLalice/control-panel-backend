import {
  ReferenceSource,
  LeadStatus,
  InquiryType,
  Priority,
  DeliveryMethod,
  InquiryStatus,
} from "@prisma/client";


export interface ScheduleOptions {
    priority?: Priority | null; // Allow null or undefined
    notes?: string | null;      // Allow null or undefined
    reminderMinutes?: number | null; // Allow null or undefined
  }

export type InquirySortField =
  | "id"
  | "customerName"
  | "status"
  | "createdAt"
  | "updatedAt";

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
  inquiryType?: InquiryType;
  priority?: Priority;
  dueDate?: Date;
  assignedToId?: string;
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
  conversionRate: number;
  byStatus: Array<{ status: string; count: number }>;
  byReferenceSource: Array<{ referenceSource: string; count: number }>;
  byInquiryType: Array<{ inquiryType: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byDeliveryMethod: Array<{ deliveryMethod: string; count: number }>;
  byProductType: Array<{ productType: string; count: number }>;
  monthlyTrends: Array<{
    month: Date;
    count: number;
    converted: number;
    closed: number;
    
  }>;
  dailyTrends?: Array<{ date: Date; count: number }>;
  averageResponseTime?: number; // in hours
  topProducts: Array<any>;
  performanceMetrics: {
    activeInquiries: number;
    avgResponseTime: number;
    totalValue: number;
  };
}

export interface MonthlyDataRaw {
  month: Date;
  count: bigint;
  converted: bigint;
  closed: bigint;
}

export interface DailyDataRaw {
  date: Date;
  count: bigint;
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


export interface InquiryContactResponse {
  exists: boolean;
  lead: any | null;
  company: any | null;
}
