"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lead_controller_1 = require("./lead.controller");
const isAuthenticated_1 = require("../../middlewares/isAuthenticated");
const rbac_1 = require("../../middlewares/rbac");
const router = express_1.default.Router();
const leadController = new lead_controller_1.LeadController();
router.get("/companies", isAuthenticated_1.isAuthenticated, leadController.getCompanies); // Public or adjust as needed
router.post("/", (0, rbac_1.createRoleMiddleware)("WRITE_LEADS"), leadController.createLead);
router.get("/", (0, rbac_1.createRoleMiddleware)("READ_LEADS"), leadController.getLeads);
router.get("/:id", (0, rbac_1.createRoleMiddleware)("READ_LEADS"), leadController.getLead);
router.put("/:id", (0, rbac_1.createRoleMiddleware)("UPDATE_LEADS"), leadController.updateLead);
router.patch("/:id/status", (0, rbac_1.createRoleMiddleware)("UPDATE_LEADS"), leadController.updateLeadStatus);
router.delete("/:id", (0, rbac_1.createRoleMiddleware)("DELETE_LEADS"), leadController.deleteLead);
router.post("/:id/assign", (0, rbac_1.createRoleMiddleware)("UPDATE_LEADS"), leadController.assignLead);
router.get("/:id/activities", (0, rbac_1.createRoleMiddleware)("READ_LEADS"), leadController.getLeadActivities);
exports.default = router;
