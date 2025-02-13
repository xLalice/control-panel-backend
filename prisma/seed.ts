import { PrismaClient, EquipmentStatus, Grade } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");

  // Clear existing data
  await prisma.equipmentPriceHistory.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.aggregatePriceHistory.deleteMany();
  await prisma.aggregate.deleteMany();
  await prisma.steelPriceHistory.deleteMany();
  await prisma.steel.deleteMany();
  await prisma.angleBarPriceHistory.deleteMany();
  await prisma.angleBar.deleteMany();
  await prisma.channelBarPriceHistory.deleteMany();
  await prisma.channelBar.deleteMany();
  await prisma.gICPurlinPriceHistory.deleteMany();
  await prisma.gICPurlin.deleteMany();
  await prisma.gISheetPriceHistory.deleteMany();
  await prisma.gISheet.deleteMany();
  await prisma.gITubularPriceHistory.deleteMany();
  await prisma.gITubular.deleteMany();
  await prisma.mSPlatePriceHistory.deleteMany();
  await prisma.mSPlate.deleteMany();

  console.log("Seeding data...");

  const equipmentData = [
    // Excavators
    {
      name: "CAT 320D",
      type: "Excavator",
      model: "320D",
      manufacturer: "Caterpillar",
      status: EquipmentStatus.Available,
      hourlyRate: 2600,
      dailyRate: 20800, // 8 hours
    },
    {
      name: "HITACHI PC200",
      type: "Excavator",
      model: "PC200",
      manufacturer: "Hitachi",
      status: EquipmentStatus.Available,
      hourlyRate: 1900,
      dailyRate: 15200,
    },
    {
      name: "MTTC 180-9",
      type: "Excavator",
      model: "180-9",
      manufacturer: "MTTC",
      status: EquipmentStatus.Available,
      hourlyRate: 1800,
      dailyRate: 14400,
    },
    {
      name: "KOBELCO SK135",
      type: "Excavator",
      model: "SK135",
      manufacturer: "Kobelco",
      status: EquipmentStatus.Available,
      hourlyRate: 1700,
      dailyRate: 13600,
    },
    {
      name: "HITACHI EX120",
      type: "Excavator",
      model: "EX120",
      manufacturer: "Hitachi",
      status: EquipmentStatus.Available,
      hourlyRate: 1600,
      dailyRate: 12800,
    },
    {
      name: "KATO HD55 (1)",
      type: "Excavator",
      model: "HD55",
      manufacturer: "Kato",
      status: EquipmentStatus.Available,
      hourlyRate: 1600,
      dailyRate: 12800,
    },
    {
      name: "KATO HD55 (2)",
      type: "Excavator",
      model: "HD55",
      manufacturer: "Kato",
      status: EquipmentStatus.Available,
      hourlyRate: 1600,
      dailyRate: 12800,
    },
    {
      name: "KOMATSU PC56",
      type: "Excavator",
      model: "PC56",
      manufacturer: "Komatsu",
      status: EquipmentStatus.Available,
      hourlyRate: 1600,
      dailyRate: 12800,
    },
    {
      name: "KOBELCO SK55",
      type: "Excavator",
      model: "SK55",
      manufacturer: "Kobelco",
      status: EquipmentStatus.Available,
      hourlyRate: 1550,
      dailyRate: 12400,
    },
    {
      name: "BACKHOE AIRMAN (1/4)",
      type: "Excavator",
      model: "1/4",
      manufacturer: "Airman",
      status: EquipmentStatus.Available,
      hourlyRate: 1400,
      dailyRate: 11200,
    },
    {
      name: "KATO HD25",
      type: "Excavator",
      model: "HD25",
      manufacturer: "Kato",
      status: EquipmentStatus.Available,
      hourlyRate: 1400,
      dailyRate: 11200,
    },
    {
      name: "PC30",
      type: "Excavator",
      model: "PC30",
      manufacturer: "Komatsu",
      status: EquipmentStatus.Available,
      hourlyRate: 1300,
      dailyRate: 10400,
    },
    {
      name: "KOBELCO SK24",
      type: "Excavator",
      model: "SK24",
      manufacturer: "Kobelco",
      status: EquipmentStatus.Available,
      hourlyRate: 1250,
      dailyRate: 10000,
    },

    // Trucking
    {
      name: "SELFLOADING TRUCK 10W",
      type: "Truck",
      model: "10W",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 2800,
      dailyRate: 22400,
    },
    {
      name: "GIGA DUMPTRUCK RED10W",
      type: "Truck",
      model: "RED10W",
      manufacturer: "Isuzu",
      status: EquipmentStatus.Available,
      hourlyRate: 2200,
      dailyRate: 17600,
    },
    {
      name: "FOTTON TORNADO",
      type: "Truck",
      model: "Tornado",
      manufacturer: "Foton",
      status: EquipmentStatus.Available,
      hourlyRate: 1500,
      dailyRate: 12000,
    },
    {
      name: "FOTTON MINIDUMP",
      type: "Truck",
      model: "Minidump",
      manufacturer: "Foton",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 7000,
    },
    {
      name: "BOOMTRUCK 2.9TONNER",
      type: "Truck",
      model: "2.9Tonner",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 1500,
      dailyRate: 12000,
    },
    {
      name: "MINIDUMP CAPRICORN",
      type: "Truck",
      model: "Capricorn",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP GARUDA",
      type: "Truck",
      model: "Garuda",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP RHYNOX",
      type: "Truck",
      model: "Rhynox",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP KABUTO",
      type: "Truck",
      model: "Kabuto",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP WHITEY",
      type: "Truck",
      model: "Whitey",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP TARUB",
      type: "Truck",
      model: "Tarub",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MINIDUMP STEPH CURRY",
      type: "Truck",
      model: "Steph Curry",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 0,
      dailyRate: 5500,
    },
    {
      name: "MULTICAB",
      type: "Truck",
      model: "Multicab",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 150,
      dailyRate: 4000,
    },

    // Other Heavy Equipment
    {
      name: "PISON BULBASAUR BLUE 4 TONNER",
      type: "Heavy Equipment",
      model: "Bulbasaur 4T",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 1200,
      dailyRate: 9600,
    },
    {
      name: "MTTC PISON 6 TONNER",
      type: "Heavy Equipment",
      model: "Pison 6T",
      manufacturer: "MTTC",
      status: EquipmentStatus.Available,
      hourlyRate: 1800,
      dailyRate: 14400,
    },
    {
      name: "MTTC PAYLOADER",
      type: "Heavy Equipment",
      model: "Payloader",
      manufacturer: "MTTC",
      status: EquipmentStatus.Available,
      hourlyRate: 1200,
      dailyRate: 9600,
    },
    {
      name: "PAYLOADER RAICHU",
      type: "Heavy Equipment",
      model: "Raichu",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 800,
      dailyRate: 6400,
    },
    {
      name: "MTTC SELF LOADING MIXER",
      type: "Heavy Equipment",
      model: "Self Loading Mixer",
      manufacturer: "MTTC",
      status: EquipmentStatus.Available,
      hourlyRate: 1500,
      dailyRate: 12000,
    },
    {
      name: "DASWELL SELF FEEDING MIXER",
      type: "Heavy Equipment",
      model: "Self Feeding Mixer",
      manufacturer: "Daswell",
      status: EquipmentStatus.Available,
      hourlyRate: 1800,
      dailyRate: 14400,
    },
    {
      name: "MINI BULLDOZER",
      type: "Heavy Equipment",
      model: "Mini Bulldozer",
      manufacturer: "Unknown",
      status: EquipmentStatus.Available,
      hourlyRate: 1200,
      dailyRate: 9600,
    },
  ];

  for (const equipment of equipmentData) {
    await prisma.equipment.create({
      data: {
        name: equipment.name,
        type: equipment.type,
        model: equipment.model,
        manufacturer: equipment.manufacturer,
        status: equipment.status,
        hourlyRate: equipment.hourlyRate,
        dailyRate: equipment.hourlyRate * 8,
      },
    });
  }
  // Aggregates
  const aggregatesProducts = [
    {
      name: "3/4 Gravel (Batangas)",
      source: "Batangas",
      pickUpPrice: 1125,
      deliveryPrice: 2625,
      unit: "PHP/CU.M",
    },
    {
      name: "3/8 Gravel (Batangas)",
      source: "Batangas",
      pickUpPrice: 450,
      deliveryPrice: 1950,
      unit: "PHP/CU.M",
    },
    {
      name: "G1 Gravel (Batangas)",
      source: "Batangas",
      pickUpPrice: 900,
      deliveryPrice: 2400,
      unit: "PHP/CU.M",
    },
    {
      name: "S1 Gravel (Batangas)",
      source: "Batangas",
      pickUpPrice: 900,
      deliveryPrice: 2400,
      unit: "PHP/CU.M",
    },
    {
      name: "Basecourse Premium (10W) (Batangas)",
      source: "Batangas",
      pickUpPrice: 6300,
      deliveryPrice: 7800,
      unit: "PHP/Truck Load",
    },
    {
      name: "Basecourse Premium (12W) (Batangas)",
      source: "Batangas",
      pickUpPrice: 9300,
      deliveryPrice: 10800,
      unit: "PHP/Truck Load",
    },
    {
      name: "Basecourse Screened (Batangas)",
      source: "Batangas",
      pickUpPrice: 180,
      deliveryPrice: 1680,
      unit: "PHP/CU.M",
    },
    {
      name: "Sub Base (Batangas)",
      source: "Batangas",
      pickUpPrice: 135,
      deliveryPrice: 1635,
      unit: "PHP/CU.M",
    },
    {
      name: "Boulders (Batangas)",
      source: "Batangas",
      pickUpPrice: 1050,
      deliveryPrice: 2550,
      unit: "PHP/CU.M",
    },
    {
      name: "Apple Size (Batangas)",
      source: "Batangas",
      pickUpPrice: 675,
      deliveryPrice: 2175,
      unit: "PHP/CU.M",
    },
    {
      name: "3/4 Gravel (Montalban)",
      source: "Montalban",
      pickUpPrice: 1275,
      deliveryPrice: 10275,
      unit: "PHP/CU.M",
    },
    {
      name: "3/8 Gravel (Montalban)",
      source: "Montalban",
      pickUpPrice: 1170,
      deliveryPrice: 10170,
      unit: "PHP/CU.M",
    },
    {
      name: "G1 Gravel (Montalban)",
      source: "Montalban",
      pickUpPrice: 1020,
      deliveryPrice: 10020,
      unit: "PHP/CU.M",
    },
    {
      name: "S1 Gravel (Montalban)",
      source: "Montalban",
      pickUpPrice: 945,
      deliveryPrice: 9945,
      unit: "PHP/CU.M",
    },
    {
      name: "Basecourse (Montalban)",
      source: "Montalban",
      pickUpPrice: 525,
      deliveryPrice: 9525,
      unit: "PHP/CU.M",
    },
    {
      name: "Sub Base (Montalban)",
      source: "Montalban",
      pickUpPrice: 405,
      deliveryPrice: 9405,
      unit: "PHP/CU.M",
    },
    {
      name: "Crushed Rock (Montalban)",
      source: "Montalban",
      pickUpPrice: 330,
      deliveryPrice: 9330,
      unit: "PHP/CU.M",
    },
  ];

  // Steel Products
  const steelData = [
    // Grade 33
    { size: "10mm", grade: Grade.Grade33, price: 131.58, stockLevel: 100 },
    { size: "10mm", grade: Grade.Grade33, price: 168.17, stockLevel: 100 },
    { size: "10mm", grade: Grade.Grade33, price: 201.8, stockLevel: 100 },
    { size: "10mm", grade: Grade.Grade33, price: 235.44, stockLevel: 100 },
    { size: "10mm", grade: Grade.Grade33, price: 269.07, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade33, price: 187.55, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade33, price: 239.76, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade33, price: 287.71, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade33, price: 335.66, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade33, price: 383.62, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade33, price: 333.37, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade33, price: 426.06, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade33, price: 511.27, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade33, price: 596.48, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade33, price: 681.7, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade33, price: 544.49, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade33, price: 695.41, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade33, price: 834.49, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade33, price: 973.58, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade33, price: 1112.66, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade33, price: 850.74, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade33, price: 1086.55, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade33, price: 1303.86, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade33, price: 1521.16, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade33, price: 1738.47, stockLevel: 100 },

    // Grade 40
    { size: "10mm", grade: Grade.Grade40, price: 147.98, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade40, price: 213.34, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade40, price: 375.65, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade40, price: 587.04, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade40, price: 917.23, stockLevel: 100 },
    { size: "28mm", grade: Grade.Grade40, price: 1150.77, stockLevel: 100 },
    { size: "32mm", grade: Grade.Grade40, price: 1516.64, stockLevel: 100 },
    { size: "36mm", grade: Grade.Grade40, price: 1919.52, stockLevel: 100 },

    // Grade 60
    { size: "10mm", grade: Grade.Grade60, price: 151.02, stockLevel: 100 },
    { size: "12mm", grade: Grade.Grade60, price: 217.71, stockLevel: 100 },
    { size: "16mm", grade: Grade.Grade60, price: 383.45, stockLevel: 100 },
    { size: "20mm", grade: Grade.Grade60, price: 599.24, stockLevel: 100 },
    { size: "25mm", grade: Grade.Grade60, price: 936.29, stockLevel: 100 },
    { size: "28mm", grade: Grade.Grade60, price: 1174.66, stockLevel: 100 },
    { size: "32mm", grade: Grade.Grade60, price: 1547.69, stockLevel: 100 },
    { size: "36mm", grade: Grade.Grade60, price: 1958.83, stockLevel: 100 },
    { size: "40mm", grade: Grade.Grade60, price: 2471.78, stockLevel: 100 },
    { size: "50mm", grade: Grade.Grade60, price: 3945.11, stockLevel: 100 },
  ];

  const seen = new Set();
  for (const steel of steelData) {
    const key = `${steel.size}-${steel.grade}`;
    if (seen.has(key)) {
      console.warn(`⚠️ Duplicate found in steelData: ${key}`);
    }
    seen.add(key);
  }

  for (const steel of steelData) {
    await prisma.steel.upsert({
      where: { size_grade: { size: steel.size, grade: steel.grade } },
      update: { price: steel.price, stockLevel: steel.stockLevel },
      create: steel,
    });
  }

  const angleBars = [
    {
      size: "1/8 X 1",
      thickness: 2.0,
      weight: 4.5,
      color: "Blue",
      price: 43.0,
    },
    { size: "3/16 X 1", thickness: 2.5, weight: 5.5, color: "Red", price: 0 },
    {
      size: "1/4 X 1",
      thickness: 3.0,
      weight: 6.6,
      color: "Yellow",
      price: 44.0,
    },
    {
      size: "1/8 x 1 1/4",
      thickness: 2.0,
      weight: 5.5,
      color: "Blue",
      price: 53.0,
    },
    {
      size: "1/8 x 1 1/2",
      thickness: 2.0,
      weight: 7.5,
      color: "Blue",
      price: 46.0,
    },
    {
      size: "3/16 x 2",
      thickness: 2.5,
      weight: 11.7,
      color: "Red",
      price: 43.0,
    },
    {
      size: "1/4 x 2",
      thickness: 3.0,
      weight: 13.7,
      color: "Yellow",
      price: 42.0,
    },
    {
      size: "3/16 x 3",
      thickness: 4.0,
      weight: 27,
      color: "Orange",
      price: 46.0,
    },
    {
      size: "1/2 x 3",
      thickness: 10.0,
      weight: 62,
      color: "Gold",
      price: 53.0,
    },
  ];

  // Seed Channel Bars
  const channelBars = [
    { size: '3" X 20', type: "L", weight: 19, price: 46.0 },
    { size: '4" X 20', type: "L", weight: 23, price: 0 },
    { size: '5" X 20', type: null, weight: 38, price: 0 },
    { size: '6" X 20', type: "L", weight: 54, price: 0 },
  ];

  // Seed GI C Purlins
  const gICPurlins = [
    { size: "2 X 3", thickness: 0.9, weight: 6.5, price: 47.0 },
    { size: "2 X 3", thickness: 1.2, weight: 8.2, price: 0 },
    { size: "2 X 3", thickness: 1.5, weight: 9.2, price: 0 },
    { size: "2 X 4", thickness: 1.0, weight: 8.6, price: 0 },
    { size: "2 X 6", thickness: 0.9, weight: 9.2, price: 0 },
  ];

  // Seed GI Sheets
  const giSheets = [
    {
      gauge: "#22",
      thickness: 0.5,
      dimensions: "4 x 8",
      weight: 7.0,
      price: 54.0,
    },
    {
      gauge: "#22",
      thickness: 0.6,
      dimensions: "4 x 8",
      weight: 8.2,
      price: 0,
    },
    {
      gauge: "#20",
      thickness: 0.9,
      dimensions: "4 x 8",
      weight: 14.0,
      price: 52.0,
    },
    {
      gauge: "#16",
      thickness: 1.2,
      dimensions: "4 x 8",
      weight: 21.0,
      price: 50.0,
    },
  ];

  // Seed GI Tubular
  const giTubulars = [
    { size: "3/4 X 3/4", thickness: 1.5, weight: 4.2, price: 50.0 },
    { size: "1 x 1", thickness: 1.5, weight: 5.2, price: 48.0 },
    { size: "1 1/4 X 1 1/4", thickness: 1.5, weight: 6.8, price: 0 },
    { size: "2 x 6", thickness: 1.5, weight: 22.0, price: 50.0 },
  ];

  // Seed MS Plates
  const msPlates = [
    { thickness: 1.5, dimensions: "4 x 8", weight: 35.01, price: 0 },
    { thickness: 2.0, dimensions: "4 x 8", weight: 46.67, price: 0 },
    { thickness: 3.0, dimensions: "4 x 8", weight: 70.01, price: 0 },
    { thickness: 4.0, dimensions: "4 x 8", weight: 93.35, price: 0 },
    { thickness: 5.0, dimensions: "4 x 8", weight: 116.69, price: 0 },
  ];

  // Create records
  for (const angleBar of angleBars) {
    if (angleBar.price) {
      // Only create records with prices
      await prisma.angleBar.create({ data: angleBar });
    }
  }

  for (const channelBar of channelBars) {
    if (channelBar.price) {
      await prisma.channelBar.create({ data: channelBar });
    }
  }

  for (const gICPurlin of gICPurlins) {
    if (gICPurlin.price) {
      await prisma.gICPurlin.create({ data: gICPurlin });
    }
  }

  for (const giSheet of giSheets) {
    if (giSheet.price) {
      await prisma.gISheet.create({ data: giSheet });
    }
  }

  for (const giTubular of giTubulars) {
    if (giTubular.price) {
      await prisma.gITubular.create({ data: giTubular });
    }
  }

  for (const msPlate of msPlates) {
    if (msPlate.price) {
      await prisma.mSPlate.create({ data: msPlate });
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
