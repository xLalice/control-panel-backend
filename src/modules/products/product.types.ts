export type ProductCategory = 'Aggregates' | 'HeavyEquipment' | 'Steel';
export type SourceLocation = 'Batangas' | 'Montalban' | 'Other';
export type PricingModel = 'PerHour' | 'PerDay' | 'PerUnit';
export type UserRole = 'admin' | 'staff';

export interface ProductCreateInput {
  category: ProductCategory;
  name: string;
  description: string;
  pricingModel: PricingModel;
  unit?: string;
  pickUpPrice?: number;
  deliveryPrice?: number;
  
  // Extended properties
  source?: SourceLocation;
  equipmentType?: string;
  grade?: string;
  length?: string;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: string;
}