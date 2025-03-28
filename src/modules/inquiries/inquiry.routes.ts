import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { createRoleMiddleware } from "../../middlewares/rbac";

const router = express.Router();
const inquiryController = new InquiryController();

router.post("/check-customer", (req, res) =>
  inquiryController.checkCustomerExists(req, res)
);

router.get(
  "/",
  isAuthenticated,
  createRoleMiddleware("READ_INQUIRIES"),
  (req, res) => inquiryController.getInquiries(req, res)
);
router.get(
  "/stats/overview",
  isAuthenticated,
  createRoleMiddleware("READ_INQUIRIES"),
  (req, res) => inquiryController.getInquiryStatistics(req, res)
);

router.get(
  "/:id",
  isAuthenticated,
  createRoleMiddleware("READ_INQUIRIES"),
  (req, res) => inquiryController.getInquiryById(req, res)
);

router.post("/", isAuthenticated, createRoleMiddleware("WRITE_INQUIRIES"), (req, res) =>
  inquiryController.createInquiry(req, res)
);

router.put("/:id", isAuthenticated, createRoleMiddleware("UPDATE_INQUIRIES"), (req, res) =>
  inquiryController.updateInquiry(req, res)
);

router.post(
  "/:id/quote",
  isAuthenticated,
  createRoleMiddleware("UPDATE_INQUIRIES"),
  (req, res) => inquiryController.createQuote(req, res)
);
router.post(
  "/:id/approve",
  isAuthenticated,
  createRoleMiddleware("UPDATE_INQUIRIES"),
  (req, res) => inquiryController.approveInquiry(req, res)
);
router.post(
  "/:id/schedule",
  isAuthenticated,
  createRoleMiddleware("UPDATE_INQUIRIES"),
  (req, res) => inquiryController.scheduleInquiry(req, res)
);
router.post(
  "/:id/fulfill",
  isAuthenticated,
  createRoleMiddleware("UPDATE_INQUIRIES"),
  (req, res) => inquiryController.fulfillInquiry(req, res)
);
router.delete("/:id", isAuthenticated, createRoleMiddleware("DELETE_INQUIRIES"), (req, res) =>
  inquiryController.deleteInquiry(req, res)
);
router.post(
  "/:id/convert-to-lead",
  isAuthenticated,
  createRoleMiddleware("UPDATE_INQUIRIES"),
  (req, res) => inquiryController.convertToLead(req, res)
);

export default router;
