import express from 'express';
import { LeadController } from './lead.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { createRoleMiddleware } from '../../middlewares/rbac';

const router = express.Router();
const leadController = new LeadController();

router.get("/companies", isAuthenticated, leadController.getCompanies); // Public or adjust as needed
router.post("/", createRoleMiddleware("WRITE_LEADS"), leadController.createLead);
router.get("/", createRoleMiddleware("READ_LEADS"), leadController.getLeads);
router.get("/:id", createRoleMiddleware("READ_LEADS"), leadController.getLead);
router.put("/:id", createRoleMiddleware("UPDATE_LEADS"), leadController.updateLead);
router.patch("/:id/status", createRoleMiddleware("UPDATE_LEADS"), leadController.updateLeadStatus);
router.delete("/:id", createRoleMiddleware("DELETE_LEADS"), leadController.deleteLead);
router.post("/:id/assign", createRoleMiddleware("UPDATE_LEADS"), leadController.assignLead);
router.get("/:id/activities", createRoleMiddleware("READ_LEADS"), leadController.getLeadActivities);


export default router;