import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const toDecimal = (val: any) => {
  if (val instanceof Decimal) return val;
  return new Decimal(val);
};

// Validation schemas
const equipmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  model: z.string().nullable(),
  manufacturer: z.string().nullable(),
  status: z.enum(['Available', 'InUse', 'Maintenance', 'Repairs']),
  hourlyRate: z.union([z.number(), z.string()]).transform(toDecimal),
  dailyRate: z.union([z.number(), z.string()]).transform(toDecimal),
  weeklyRate: z.union([z.number(), z.string()]).transform(toDecimal).nullable(),
  imageUrl: z.string().nullable(),
  maintenanceSchedule: z.string().datetime().nullable(),
  lastMaintenance: z.string().datetime().nullable(),
  purchaseDate: z.string().datetime().nullable(),
  updatedBy: z.string()
});

const aggregateSchema = z.object({
  name: z.string(),
  type: z.string(),
  source: z.enum(['Batangas', 'Montalban']),
  pickupPrice: z.union([z.number(), z.string()]).transform(toDecimal),
  deliveryPrice: z.union([z.number(), z.string()]).transform(toDecimal),
  unit: z.string(),
  stockLevel: z.number().nullable(),
  minStock: z.number().nullable(),
  updatedBy: z.string()
});

const steelSchema = z.object({
  size: z.string(),
  grade: z.enum(['Grade33', 'Grade40', 'Grade60']),
  length: z.number().default(6),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  unit: z.string().default('length'),
  stockLevel: z.number().nullable(),
  updatedBy: z.string()
});

const angleBarSchema = z.object({
  size: z.string(),
  thickness: z.union([z.number(), z.string()]).transform(toDecimal),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  color: z.string().nullable().optional(),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  thickness: toDecimal(data.thickness),
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));

const channelBarSchema = z.object({
  size: z.string(),
  type: z.string().nullable().optional(),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));

const gicPurlinSchema = z.object({
  size: z.string(),
  thickness: z.union([z.number(), z.string()]).transform(toDecimal),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  thickness: toDecimal(data.thickness),
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));

const giSheetSchema = z.object({
  gauge: z.string(),
  thickness: z.union([z.number(), z.string()]).transform(toDecimal),
  dimensions: z.string(),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  thickness: toDecimal(data.thickness),
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));

const giTubularSchema = z.object({
  size: z.string(),
  thickness: z.union([z.number(), z.string()]).transform(toDecimal),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  thickness: toDecimal(data.thickness),
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));

const msPlateSchema = z.object({
  thickness: z.union([z.number(), z.string()]).transform(toDecimal),
  dimensions: z.string(),
  weight: z.union([z.number(), z.string()]).transform(toDecimal),
  price: z.union([z.number(), z.string()]).transform(toDecimal),
  updatedBy: z.string()
}).transform((data) => ({
  ...data,
  thickness: toDecimal(data.thickness),
  weight: toDecimal(data.weight),
  price: toDecimal(data.price)
}));


// Controllers
export const getEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    });
    
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching equipment", error });
  }
};

export const createEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = equipmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { updatedBy, ...equipmentData } = validation.data;
    
    const equipment = await prisma.equipment.create({
      data: equipmentData
    });

    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: "Error creating equipment", error });
  }
};

export const updateEquipmentRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = equipmentSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { hourlyRate, dailyRate, weeklyRate, status, updatedBy, ...otherData } = validation.data;

    // Fetch existing rates
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Equipment not found" });
      return;
    }

    // Update and log price history
    await prisma.$transaction([
      prisma.equipmentPriceHistory.create({
        data: {
          equipmentId: id,
          oldHourlyRate: existing.hourlyRate,
          newHourlyRate: hourlyRate,
          oldDailyRate: existing.dailyRate,
          newDailyRate: dailyRate,
          changedBy: updatedBy
        }
      }),
      prisma.equipment.update({
        where: { id },
        data: {
          hourlyRate,
          dailyRate,
          weeklyRate,
          status,
          ...otherData
        }
      })
    ]);

    res.json({ message: "Equipment updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating equipment rates", error });
  }
};

export const deleteEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Equipment not found" });
      return;
    }

    // Delete equipment and related price history
    await prisma.$transaction([
      prisma.equipmentPriceHistory.deleteMany({
        where: { equipmentId: id }
      }),
      prisma.equipment.delete({
        where: { id }
      })
    ]);

    res.json({ message: "Equipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting equipment", error });
  }
};

export const getEquipmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!equipment) {
      res.status(404).json({ message: "Equipment not found" });
      return;
    }

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching equipment", error });
  }
};

export const getAggregates = async (req: Request, res: Response): Promise<void> => {
  try {
    const aggregates = await prisma.aggregate.findMany({
      include: {
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    });
    res.json(aggregates);
  } catch (error) {
    res.status(500).json({ message: "Error fetching aggregates", error });
  }
};

export const createAggregate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = aggregateSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { updatedBy, ...aggregateData } = validation.data;
    
    const aggregate = await prisma.aggregate.create({
      data: aggregateData
    });

    res.status(201).json(aggregate);
  } catch (error) {
    res.status(500).json({ message: "Error creating aggregate", error });
  }
};

export const updateAggregate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = aggregateSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { pickupPrice, deliveryPrice, updatedBy, ...otherData } = validation.data;

    const existing = await prisma.aggregate.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Aggregate not found" });
      return;
    }

    await prisma.$transaction([
      prisma.aggregatePriceHistory.create({
        data: {
          aggregateId: id,
          oldPickupPrice: existing.pickupPrice,
          newPickupPrice: pickupPrice,
          oldDeliveryPrice: existing.deliveryPrice,
          newDeliveryPrice: deliveryPrice,
          changedBy: updatedBy
        }
      }),
      prisma.aggregate.update({
        where: { id },
        data: {
          pickupPrice,
          deliveryPrice,
          ...otherData
        }
      })
    ]);

    res.json({ message: "Aggregate updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating aggregate", error });
  }
};

// Steel Controllers
export const getSteels = async (req: Request, res: Response): Promise<void> => {
  try {
    const steels = await prisma.steel.findMany({
      include: {
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5
        }
      }
    });
    res.json(steels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching steels", error });
  }
};

export const createSteel = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = steelSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { updatedBy, ...steelData } = validation.data;
    
    const steel = await prisma.steel.create({
      data: steelData
    });

    res.status(201).json(steel);
  } catch (error) {
    res.status(500).json({ message: "Error creating steel", error });
  }
};

export const updateSteel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = steelSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ message: "Invalid data", errors: validation.error });
      return;
    }

    const { price, updatedBy, ...otherData } = validation.data;

    const existing = await prisma.steel.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Steel not found" });
      return;
    }

    await prisma.$transaction([
      prisma.steelPriceHistory.create({
        data: {
          steelId: id,
          oldPrice: existing.price,
          newPrice: price,
          changedBy: updatedBy
        }
      }),
      prisma.steel.update({
        where: { id },
        data: {
          price,
          ...otherData
        }
      })
    ]);

    res.json({ message: "Steel updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating steel", error });
  }
};

// Generic controller factory for other materials
const createMaterialControllers = <
  T extends Record<string, any>,
  K extends z.ZodType<any, any, any>
>(
  model: any,
  priceHistoryModel: any,
  schema: K,
  modelName: string
) => ({
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await model.findMany({
        include: {
          priceHistory: {
            orderBy: { changedAt: 'desc' },
            take: 5
          }
        }
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: `Error fetching ${modelName}s`, error });
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({ message: "Invalid data", errors: validation.error });
        return;
      }

      const { updatedBy, ...itemData } = validation.data;
      
      const item = await model.create({
        data: itemData as T
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: `Error creating ${modelName}`, error });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({ message: "Invalid data", errors: validation.error });
        return;
      }

      const { price, updatedBy, ...otherData } = validation.data;

      const existing = await model.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: `${modelName} not found` });
        return;
      }

      await prisma.$transaction([
        priceHistoryModel.create({
          data: {
            [`${modelName.toLowerCase()}Id`]: id,
            oldPrice: existing.price,
            newPrice: price,
            changedBy: updatedBy
          }
        }),
        model.update({
          where: { id },
          data: {
            price,
            ...otherData
          } as T
        })
      ]);

      res.json({ message: `${modelName} updated successfully` });
    } catch (error) {
      res.status(500).json({ message: `Error updating ${modelName}`, error });
    }
  }
});

// Create controllers for remaining models using the factory
export const angleBarControllers = createMaterialControllers(
  prisma.angleBar,
  prisma.angleBarPriceHistory,
  angleBarSchema,
  'AngleBar'
);

export const channelBarControllers = createMaterialControllers(
  prisma.channelBar,
  prisma.channelBarPriceHistory,
  channelBarSchema,
  'ChannelBar'
);

export const gicPurlinControllers = createMaterialControllers(
  prisma.gICPurlin,
  prisma.gICPurlinPriceHistory,
  gicPurlinSchema,
  'GICPurlin'
);

export const giSheetControllers = createMaterialControllers(
  prisma.gISheet,
  prisma.gISheetPriceHistory,
  giSheetSchema,
  'GISheet'
);

export const giTubularControllers = createMaterialControllers(
  prisma.gITubular,
  prisma.gITubularPriceHistory,
  giTubularSchema,
  'GITubular'
);

export const msPlateControllers = createMaterialControllers(
  prisma.mSPlate,
  prisma.mSPlatePriceHistory,
  msPlateSchema,
  'MSPlate'
);