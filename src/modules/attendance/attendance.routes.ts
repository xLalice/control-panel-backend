import express from "express";
import { attendanceController } from "./attendanceControllers";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { createRoleMiddleware } from "../../middlewares/rbac";
import { create } from "domain";
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
router.get("/all", createRoleMiddleware("READ_ALL") , attendanceController.getAllAttendance);
router.get("/user/:userId", createRoleMiddleware("READ_ALL"), attendanceController.getUserAttendance);
router.put("/settings", createRoleMiddleware("WRITE_ALL"), attendanceController.updateSettings);
router.post("/allowed-ips", createRoleMiddleware("WRITE_ALL"), attendanceController.manageAllowedIPs);

export default router;
