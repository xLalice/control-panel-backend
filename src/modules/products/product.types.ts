import { Category, PricingUnit } from "../../../prisma/generated/prisma/enums";

export type SourceLocation = 'Batangas' | 'Montalban' | 'Other';
export type PricingModel = 'PerHour' | 'PerDay' | 'PerUnit';
export type UserRole = 'admin' | 'staff';

export type ProductCreateInput = {
  category: Category;
  name: string;
  description: string;
  basePrice: number;
  pricingUnit: PricingUnit;
  pricingDetails?: Record<string, any>;
  unit?: string;
  pickUpPrice?: number;
  deliveryPrice?: number;
  sku: string;
  
  // Aggregate specific
  source?: string;
  weightPerUnit?: number;
  
  // Heavy Equipment specific
  equipmentType?: string;
  
  // Steel specific
  grade?: string;
  length?: string;
  type?: string;
  color?: string;
  size?: string;
  additionalAttributes?: Record<string, any>;
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export type ProductCategory = Category;

