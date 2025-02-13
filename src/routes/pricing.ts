import express from "express";
import { getAllPrices, getPriceByCategory, addPrice, updatePrice, deletePrice, getPriceHistory } from "../controllers/pricingControllers";

const router = express.Router();

// Routes
router.get("/prices", getAllPrices);
router.get("/prices/:category", getPriceByCategory);
router.post("/prices", addPrice);
router.put("/prices/:id", updatePrice);
router.delete("/prices/:id", deletePrice);
router.get("/price-history/:productId", getPriceHistory);

export default router;
