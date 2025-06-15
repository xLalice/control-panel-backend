import express from "express";
import { LeadController } from "./lead.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";

const router = express.Router();
const leadController = new LeadController();

router.get("/companies", isAuthenticated, leadController.getCompanies);
router.post(
  "/",
  checkPermission("create:lead"),
  isAuthenticated,
  leadController.createLead
);
router.get(
  "/",
  checkPermission("read:all_leads"),
  isAuthenticated,
  leadController.getLeads
);
router.get(
  "/:id",
  checkPermission("read:all_leads"),
  isAuthenticated,
  leadController.getLead
);
router.put(
  "/:id",
  checkPermission("read:all_leads"),
  isAuthenticated,
  leadController.updateLead
);
router.patch(
  "/:id/status",
  checkPermission("update:all_leads"),
  isAuthenticated,
  leadController.updateLeadStatus
);
router.delete(
  "/:id",
  checkPermission("delete:all_leads"),
  isAuthenticated,
  leadController.deleteLead
);
router.post(
  "/:id/assign",
  checkPermission("assign:all_leads"),
  isAuthenticated,
  leadController.assignLead
);
router.post("/convert-to-client/:id",
    isAuthenticated,
    leadController.convertLeadToClient
);
router.get(
  "/:id/activities",
  checkPermission("get:all_leads"),
  isAuthenticated,
  leadController.getLeadActivities
);

export default router;
