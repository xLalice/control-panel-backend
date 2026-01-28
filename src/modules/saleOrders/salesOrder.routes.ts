import express from "express";
import { SalesOrderController } from "./salesOrder.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import {prisma} from "../../config/prisma";
import { SalesOrderService } from "./salesOrder.service";

const router = express.Router();
const salesOrderService = new SalesOrderService(prisma);
const salesOrderController = new SalesOrderController(salesOrderService);

router.get("/", isAuthenticated, salesOrderController.fetch);
router.get("/:id", isAuthenticated, salesOrderController.fetchById);
router.post("/", isAuthenticated, salesOrderController.create);
router.patch("/", isAuthenticated, salesOrderController.update);


export default router;