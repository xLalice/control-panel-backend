import express from 'express';
import { LeadController } from './lead.controller';
import { middlewares } from '../../middlewares/rbac';
import { isAuthenticated } from '../../middlewares/isAuthenticated';

const router = express.Router();
const leadController = new LeadController();

router.get("/companies", isAuthenticated, leadController.getCompanies); // Public or adjust as needed
router.post("/", middlewares.leadWrite, leadController.createLead);
router.get("/", middlewares.leadRead, leadController.getLeads);
router.get("/:id", middlewares.leadRead, leadController.getLead);
router.put("/:id", middlewares.leadUpdate, leadController.updateLead);
router.patch("/:id/status", middlewares.leadUpdate, leadController.updateLeadStatus);
router.delete("/:id", middlewares.leadDelete, leadController.deleteLead);
router.post("/:id/assign", middlewares.leadUpdate, leadController.assignLead);
router.get("/:id/activities", middlewares.leadRead, leadController.getLeadActivities);


export default router;