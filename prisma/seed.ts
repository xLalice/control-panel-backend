import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  // Seed Aggregates
  const aggregatesData = [
    {
      category: 'Aggregate',
      name: 'Gravel 3/4"',
      description: 'Gravel aggregate, 3/4" size',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 1125,
      deliveryPrice: 2625,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Gravel 3/8"',
      description: 'Gravel aggregate, 3/8" size',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 450,
      deliveryPrice: 1950,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'G',
      description: 'G type aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 900,
      deliveryPrice: 2400,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'S',
      description: 'S type aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 900,
      deliveryPrice: 2400,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Basecourse Premium (10 Wheeler)',
      description: 'Premium basecourse aggregate, 10 Wheeler/Truck Load',
      pricingModel: 'Per Truck',
      unit: 'Truck',
      pickUpPrice: 6300,
      deliveryPrice: 7800,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Basecourse Premium (12 Wheeler)',
      description: 'Premium basecourse aggregate, 12 Wheeler/Truck Load',
      pricingModel: 'Per Truck',
      unit: 'Truck',
      pickUpPrice: 9300,
      deliveryPrice: 10800,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Basecourse Screened',
      description: 'Screened basecourse aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 180,
      deliveryPrice: 1680,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Sub Base',
      description: 'Sub base aggregate material',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 135,
      deliveryPrice: 1635,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Boulders',
      description: 'Boulder stones',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 1050,
      deliveryPrice: 2550,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Apple Size',
      description: 'Apple sized aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 675,
      deliveryPrice: 2175,
      aggregate: {
        create: {
          source: 'Batangas'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Gravel 3/4"',
      description: 'Gravel aggregate, 3/4" size',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 1275,
      deliveryPrice: 10275,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Gravel 3/8"',
      description: 'Gravel aggregate, 3/8" size',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 1170,
      deliveryPrice: 10170,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'G',
      description: 'G type aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 1020,
      deliveryPrice: 10020,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'S',
      description: 'S type aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 945,
      deliveryPrice: 9945,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Basecourse',
      description: 'Basecourse aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 525,
      deliveryPrice: 9525,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Sub Base',
      description: 'Sub base aggregate material',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 405,
      deliveryPrice: 9405,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
    {
      category: 'Aggregate',
      name: 'Crushed Rock',
      description: 'Crushed rock aggregate',
      pricingModel: 'Per CBM',
      unit: 'CBM',
      pickUpPrice: 330,
      deliveryPrice: 9330,
      aggregate: {
        create: {
          source: 'Montalban'
        }
      }
    },
  ];

  // Seed Heavy Equipment
  const equipmentData = [
    {
      category: 'Heavy Equipment',
      name: 'CAT 320D',
      description: 'Excavator',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 2600,
      heavyEquipment: {
        create: {
          equipmentType: 'Excavator'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'HITACHI PC200',
      description: 'Excavator',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 1900,
      heavyEquipment: {
        create: {
          equipmentType: 'Excavator'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'MTTC 180-9',
      description: 'Excavator',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 1800,
      heavyEquipment: {
        create: {
          equipmentType: 'Excavator'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'KOBELCO SK135',
      description: 'Excavator',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 1700,
      heavyEquipment: {
        create: {
          equipmentType: 'Excavator'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'SELFLOADING TRUCK 10W',
      description: 'Trucking equipment',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 2800,
      heavyEquipment: {
        create: {
          equipmentType: 'Trucking'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'GIGA DUMPTRUCK RED10W',
      description: 'Trucking equipment',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 2200,
      heavyEquipment: {
        create: {
          equipmentType: 'Trucking'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'PISON BULBASAUR BLUE 4 TONNER',
      description: 'Pison equipment',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 1200,
      heavyEquipment: {
        create: {
          equipmentType: 'Other'
        }
      }
    },
    {
      category: 'Heavy Equipment',
      name: 'MTTC PISON 6 TONNER',
      description: 'Pison equipment',
      pricingModel: 'Per Hour',
      unit: 'HR',
      pickUpPrice: 1800,
      heavyEquipment: {
        create: {
          equipmentType: 'Other'
        }
      }
    },
  ];

  // Seed Steel Products
  const steelData = [
    // Grade 33 Steel
    {
      category: 'Steel',
      name: '10mm Grade 33 Rebar - 6m',
      description: 'Grade 33 Structural Steel Rebar, 10mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 131.58,
      steel: {
        create: {
          grade: 'Grade 33',
          length: '6m'
        }
      }
    },
    {
      category: 'Steel',
      name: '10mm Grade 33 Rebar - 7.5m',
      description: 'Grade 33 Structural Steel Rebar, 10mm diameter, 7.5 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 168.17,
      steel: {
        create: {
          grade: 'Grade 33',
          length: '7.5m'
        }
      }
    },
    {
      category: 'Steel',
      name: '12mm Grade 33 Rebar - 6m',
      description: 'Grade 33 Structural Steel Rebar, 12mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 187.55,
      steel: {
        create: {
          grade: 'Grade 33',
          length: '6m'
        }
      }
    },
    // Grade 40 Steel
    {
      category: 'Steel',
      name: '10mm Grade 40 Rebar - 6m',
      description: 'Grade 40 Structural Steel Rebar, 10mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 147.98,
      steel: {
        create: {
          grade: 'Grade 40',
          length: '6m'
        }
      }
    },
    {
      category: 'Steel',
      name: '12mm Grade 40 Rebar - 6m',
      description: 'Grade 40 Structural Steel Rebar, 12mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 213.34,
      steel: {
        create: {
          grade: 'Grade 40',
          length: '6m'
        }
      }
    },
    // Grade 60 Steel
    {
      category: 'Steel',
      name: '10mm Grade 60 Rebar - 6m',
      description: 'Grade 60 Structural Steel Rebar, 10mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 151.02,
      steel: {
        create: {
          grade: 'Grade 60',
          length: '6m'
        }
      }
    },
    {
      category: 'Steel',
      name: '12mm Grade 60 Rebar - 6m',
      description: 'Grade 60 Structural Steel Rebar, 12mm diameter, 6 meter length',
      pricingModel: 'Per Piece',
      unit: 'PC',
      pickUpPrice: 217.71,
      steel: {
        create: {
          grade: 'Grade 60',
          length: '6m'
        }
      }
    },
    // Angle Bars
    {
      category: 'Steel',
      name: 'Angle Bar 1/8" x 1" - 2.0mm (Blue)',
      description: 'Angle Bar, 1/8" x 1", 2.0mm thickness, Blue color, 4.5kg',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 43.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
    {
      category: 'Steel',
      name: 'Angle Bar 1/4" x 1" - 3.0mm (Yellow)',
      description: 'Angle Bar, 1/4" x 1", 3.0mm thickness, Yellow color, 6.6kg',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 44.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
    // Channel Bars
    {
      category: 'Steel',
      name: 'Channel Bar 3" x 20 L - 19kg',
      description: 'Channel Bar, 3" x 20 L, 19kg weight',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 46.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
    // GI C Purlins
    {
      category: 'Steel',
      name: 'G.I. C Purlin 2" x 3" - 0.9mm (6.5kg)',
      description: 'G.I. C Purlin, 2" x 3", 0.9mm thickness, 6.5kg weight',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 47.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
    // GI Sheets
    {
      category: 'Steel',
      name: 'G.I. Sheet #22 0.5mm x 4 x 8 - 7kg',
      description: 'G.I. Sheet, #22 gauge, 0.5mm x 4 x 8, 7kg weight',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 54.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
    // GI Tubular
    {
      category: 'Steel',
      name: 'G.I. Tubular 3/4" x 3/4" - 1.50mm (4.2kg)',
      description: 'G.I. Tubular, 3/4" x 3/4", 1.50mm thickness, 4.2kg weight',
      pricingModel: 'Per Kilogram',
      unit: 'KG',
      pickUpPrice: 50.00,
      steel: {
        create: {
          grade: 'Regular',
          length: 'Standard'
        }
      }
    },
  ];

  // Create all aggregates
  console.log('Creating aggregate products...');
  for (const data of aggregatesData) {
    await prisma.product.create({
      data
    });
  }

  // Create all equipment
  console.log('Creating heavy equipment products...');
  for (const data of equipmentData) {
    await prisma.product.create({
      data
    });
  }

  // Create all steel
  console.log('Creating steel products...');
  for (const data of steelData) {
    await prisma.product.create({
      data
    });
  }

  console.log('Seed completed successfully');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });