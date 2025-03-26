import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { middlewares } from "../../middlewares/rbac";

const router = express.Router();
const inquiryController = new InquiryController();

// Public endpoint (no authentication or role check)
router.post("/check-customer", (req, res) => inquiryController.checkCustomerExists(req, res));

// Protected endpoints with role-based access control
router.get("/", isAuthenticated, middlewares.inquiryRead, (req, res) => inquiryController.getInquiries(req, res));
router.get("/stats/overview", isAuthenticated, middlewares.inquiryRead, (req, res) => inquiryController.getInquiryStatistics(req, res));
router.get("/:id", isAuthenticated, middlewares.inquiryRead, (req, res) => inquiryController.getInquiryById(req, res));
router.post("/", isAuthenticated, middlewares.inquiryWrite, (req, res) => inquiryController.createInquiry(req, res));
router.put("/:id", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.updateInquiry(req, res));
router.post("/:id/quote", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.createQuote(req, res));
router.post("/:id/approve", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.approveInquiry(req, res));
router.post("/:id/schedule", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.scheduleInquiry(req, res));
router.post("/:id/fulfill", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.fulfillInquiry(req, res));
router.delete("/:id", isAuthenticated, middlewares.inquiryDelete, (req, res) => inquiryController.deleteInquiry(req, res));
router.post("/:id/convert-to-lead", isAuthenticated, middlewares.inquiryUpdate, (req, res) => inquiryController.convertToLead(req, res));

export default router;