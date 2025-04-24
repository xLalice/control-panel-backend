import express from "express";
import { attendanceController } from "./attendanceControllers";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";

const router = express.Router();

// Employee routes
router.post(
  "/clock-in",
  isAuthenticated,
  checkPermission("log:attendance"),
  attendanceController.clockIn
);
router.post(
  "/clock-out",
  isAuthenticated,
  checkPermission("log:attendance"),
  attendanceController.clockOut
);
router.post(
  "/break/start",
  isAuthenticated,
  checkPermission("log:attendance"),
  attendanceController.startBreak
);
router.post(
  "/break/end",
  isAuthenticated,
  checkPermission("log:attendance"),
  attendanceController.endBreak
);
router.get(
  "/my-attendance",
  isAuthenticated,
  checkPermission("read:own_attendance"),
  (req, res) => {
    attendanceController.getUserAttendance(req, res);
  }
);

// Admin routes
router.get(
  "/all",
  isAuthenticated,
  checkPermission("read:all_attendance"),
  attendanceController.getAllAttendance
);
router.get(
  "/user/:userId",
  isAuthenticated,
  checkPermission("read:all_attendance"),
  attendanceController.getUserAttendance
);
router.put(
  "/settings",
  isAuthenticated,
  checkPermission("manage:dtr_settings"),
  attendanceController.updateSettings
);
router.post(
  "/allowed-ips",
  isAuthenticated,
  checkPermission("manage:allowed_ips"),
  attendanceController.manageAllowedIPs
);

export default router;