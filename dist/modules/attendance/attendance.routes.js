"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendanceControllers_1 = require("./attendanceControllers");
const isAuthenticated_1 = require("../../middlewares/isAuthenticated");
const rbac_1 = require("../../middlewares/rbac");
const router = express_1.default.Router();
// Employee routes
router.post("/clock-in", isAuthenticated_1.isAuthenticated, attendanceControllers_1.attendanceController.clockIn);
router.post("/clock-out", isAuthenticated_1.isAuthenticated, attendanceControllers_1.attendanceController.clockOut);
router.post("/break/start", isAuthenticated_1.isAuthenticated, attendanceControllers_1.attendanceController.startBreak);
router.post("/break/end", isAuthenticated_1.isAuthenticated, attendanceControllers_1.attendanceController.endBreak);
router.get("/my-attendance", isAuthenticated_1.isAuthenticated, (req, res) => {
    attendanceControllers_1.attendanceController.getUserAttendance(req, res);
});
// Admin routes
router.get("/all", (0, rbac_1.createRoleMiddleware)("READ_ALL"), attendanceControllers_1.attendanceController.getAllAttendance);
router.get("/user/:userId", (0, rbac_1.createRoleMiddleware)("READ_ALL"), attendanceControllers_1.attendanceController.getUserAttendance);
router.put("/settings", (0, rbac_1.createRoleMiddleware)("WRITE_ALL"), attendanceControllers_1.attendanceController.updateSettings);
router.post("/allowed-ips", (0, rbac_1.createRoleMiddleware)("WRITE_ALL"), attendanceControllers_1.attendanceController.manageAllowedIPs);
exports.default = router;
