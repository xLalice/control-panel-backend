import { Category } from '../../../prisma/generated/prisma/enums';

export function generateSKU(category: Category): string {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); 
  let prefix = "";

  switch (category) {
    case Category.AGGREGATE:
      prefix = "AGG";
      break;
    case Category.HEAVY_EQUIPMENT:
      prefix = "HEQ";
      break;
    case Category.STEEL:
      prefix = "STE";
      break;
    default:
      prefix = "PRD";
  }

  return `${prefix}-${randomStr}`;
}
