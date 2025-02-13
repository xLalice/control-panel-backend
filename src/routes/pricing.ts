import express from "express";
import {
  // Equipment controllers
  getEquipment,
  createEquipment,
  updateEquipmentRates,
  deleteEquipment,
  getEquipmentById,
  
  // Aggregate controllers
  getAggregates,
  createAggregate,
  updateAggregate,
  
  // Steel controllers
  getSteels,
  createSteel,
  updateSteel,
  
  // Other material controllers
  angleBarControllers,
  channelBarControllers,
  gicPurlinControllers,
  giSheetControllers,
  giTubularControllers,
  msPlateControllers,
} from "../controllers/pricingControllers";

const router = express.Router();

// Equipment Routes
router.get("/equipment", getEquipment);
router.get("/equipment/:id", getEquipmentById);
router.post("/equipment", createEquipment);
router.put("/equipment/:id", updateEquipmentRates);
router.delete("/equipment/:id", deleteEquipment);

// Aggregates Routes
router.get("/aggregates", getAggregates);
router.post("/aggregates", createAggregate);
router.put("/aggregates/:id", updateAggregate);

// Steel Routes
router.get("/steel", getSteels);
router.post("/steel", createSteel);
router.put("/steel/:id", updateSteel);

// Angle Bar Routes
router.get("/angle-bars", angleBarControllers.getAll);
router.post("/angle-bars", angleBarControllers.create);
router.put("/angle-bars/:id", angleBarControllers.update);

// Channel Bar Routes
router.get("/channel-bars", channelBarControllers.getAll);
router.post("/channel-bars", channelBarControllers.create);
router.put("/channel-bars/:id", channelBarControllers.update);

// GIC Purlin Routes
router.get("/gic-purlins", gicPurlinControllers.getAll);
router.post("/gic-purlins", gicPurlinControllers.create);
router.put("/gic-purlins/:id", gicPurlinControllers.update);

// GI Sheet Routes
router.get("/gi-sheets", giSheetControllers.getAll);
router.post("/gi-sheets", giSheetControllers.create);
router.put("/gi-sheets/:id", giSheetControllers.update);

// GI Tubular Routes
router.get("/gi-tubulars", giTubularControllers.getAll);
router.post("/gi-tubulars", giTubularControllers.create);
router.put("/gi-tubulars/:id", giTubularControllers.update);

// MS Plate Routes
router.get("/ms-plates", msPlateControllers.getAll);
router.post("/ms-plates", msPlateControllers.create);
router.put("/ms-plates/:id", msPlateControllers.update);

export default router;