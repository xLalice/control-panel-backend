import express from "express";
import { attendanceController } from "./attendanceControllers";
const router = express.Router();

// Employee routes
router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);
router.post("/break/start", attendanceController.startBreak);
router.post("/break/end", attendanceController.endBreak);
router.get("/my-attendance", (req, res) => {
  attendanceController.getUserAttendance(req, res);
});

// Admin routes
router.get("/all", attendanceController.getAllAttendance);
router.get("/user/:userId", attendanceController.getUserAttendance);
router.put("/settings", attendanceController.updateSettings);
router.post("/allowed-ips", attendanceController.manageAllowedIPs);

export default router;
