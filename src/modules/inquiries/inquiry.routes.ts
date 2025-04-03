import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router = express.Router();
const inquiryController = new InquiryController();

// Public endpoint
router.post("/check-customer", (req, res) => inquiryController.checkCustomerExists(req, res));

// Protected endpoints (assuming authentication is required)
router.get("/", isAuthenticated, (req, res) => inquiryController.getInquiries(req, res));
router.get("/stats/overview", isAuthenticated, (req, res) => inquiryController.getInquiryStatistics(req, res));
router.get("/:id", isAuthenticated, (req, res) => inquiryController.getInquiryById(req, res));
router.post("/", isAuthenticated, (req, res) => inquiryController.createInquiry(req, res));
router.put("/:id", isAuthenticated, (req, res) => inquiryController.updateInquiry(req, res));
router.post("/:id/quote", isAuthenticated, (req, res) => inquiryController.createQuote(req, res));
router.post("/:id/approve", isAuthenticated, (req, res) => inquiryController.approveInquiry(req, res));
router.post("/:id/schedule", isAuthenticated, (req, res) => inquiryController.scheduleInquiry(req, res));
router.post("/:id/fulfill", isAuthenticated, (req, res) => inquiryController.fulfillInquiry(req, res));
router.delete("/:id", isAuthenticated, (req, res) => inquiryController.deleteInquiry(req, res));
router.post("/:id/convert-to-lead", isAuthenticated, (req, res) => inquiryController.convertToLead(req, res));

export default router;