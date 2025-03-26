import express from "express";
import { attendanceController } from "./attendanceControllers";
import { middlewares } from "../../middlewares/rbac";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
const router = express.Router();

// Employee routes
router.post("/clock-in", isAuthenticated, attendanceController.clockIn);
router.post("/clock-out", isAuthenticated, attendanceController.clockOut);
router.post("/break/start", isAuthenticated, attendanceController.startBreak);
router.post("/break/end", isAuthenticated, attendanceController.endBreak);
router.get("/my-attendance", isAuthenticated,(req, res) => {
  attendanceController.getUserAttendance(req, res);
});

// Admin routes
router.get("/all", middlewares.adminOnly , attendanceController.getAllAttendance);
router.get("/user/:userId", middlewares.adminOnly, attendanceController.getUserAttendance);
router.put("/settings", middlewares.adminOnly, attendanceController.updateSettings);
router.post("/allowed-ips", middlewares.adminOnly, attendanceController.manageAllowedIPs);

export default router;
