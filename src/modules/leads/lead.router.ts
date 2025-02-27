import express from 'express';
import { LeadController } from './lead.controller';

const router = express.Router();
const leadController = new LeadController();

// Lead routes
router.get("/companies", leadController.getCompanies);
router.post('/', leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.put('/:id', leadController.updateLead);
router.patch('/:id/status', leadController.updateLeadStatus);
router.delete('/:id', leadController.deleteLead);

router.post('/:id/assign', leadController.assignLead);
router.get('/:id/activities', leadController.getLeadActivities);


export default router;