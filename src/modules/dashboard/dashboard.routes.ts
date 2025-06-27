import { Router } from "express";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { DashboardController } from "./dashboard.controller";

const router = Router();

const dashboardController = new DashboardController();

router.get('/', dashboardController.getDashboardData);

export default router;