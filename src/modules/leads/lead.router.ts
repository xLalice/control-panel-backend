import express from 'express';
import { LeadController } from './lead.controller';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import { checkPermission } from '../../middlewares/authorization';

const router = express.Router();
const leadController = new LeadController();

router.get("/companies", isAuthenticated, leadController.getCompanies); 
router.post("/", checkPermission("create:lead"), leadController.createLead);
router.get("/", checkPermission("read:all_leads"), leadController.getLeads);
router.get("/:id", checkPermission("read:all_leads"), leadController.getLead);
router.put("/:id", checkPermission("read:all_leads"), leadController.updateLead);
router.patch("/:id/status", checkPermission("update:all_leads"), leadController.updateLeadStatus);
router.delete("/:id", checkPermission("delete:all_leads"), leadController.deleteLead);
router.post("/:id/assign", checkPermission("assign:all_leads"), leadController.assignLead);
router.get("/:id/activities", checkPermission("get:all_leads"), leadController.getLeadActivities);


export default router;