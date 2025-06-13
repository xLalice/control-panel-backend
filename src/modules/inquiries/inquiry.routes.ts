import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";
import { validate } from "../../middlewares/validate";
import { inquiryIdSchema, scheduleInquirySchema, quoteSchema, updateInquirySchema, createInquirySchema, filterInquirySchema } from "./inquiry.schema";

const router = express.Router();
const inquiryController = new InquiryController();

router.post("/check-customer", (req, res) =>
  inquiryController.checkCustomerExists(req, res)
);

router.get(
  "/",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  validate(filterInquirySchema, "body"),
  (req, res) => inquiryController.getInquiries(req, res)
);

router.get(
  "/stats-overview",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res) => inquiryController.getInquiryStatistics(req, res)
);

router.get(
  "/:id",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  validate(inquiryIdSchema, "params"),
  (req, res) => inquiryController.getInquiryById(req, res)
);

router.post(
  "/",
  isAuthenticated,
  checkPermission("create:inquiry"),
  validate(createInquirySchema, "body"),
  (req, res) => inquiryController.createInquiry(req, res)
);

router.put(
  "/:id",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  validate(inquiryIdSchema, "params"),
  validate(updateInquirySchema, "body"),
  (req, res) => inquiryController.updateInquiry(req, res)
);

router.post(
  "/:id/quote",
  isAuthenticated,
  checkPermission("quote:inquiry"),
  validate(inquiryIdSchema, "params"),
  validate(quoteSchema, "body"),
  (req, res) => inquiryController.createQuote(req, res)
);

router.post(
  "/:id/approve",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  validate(inquiryIdSchema, "params"),
  (req, res) => inquiryController.approveInquiry(req, res)
);

router.post(
  "/:id/schedule",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  validate(scheduleInquirySchema, "body") ,
  (req, res) => inquiryController.scheduleInquiry(req, res)
);

router.post(
  "/:id/fulfill",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res) => inquiryController.fulfillInquiry(req, res)
);

router.delete(
  "/:id",
  isAuthenticated,
  checkPermission("delete:all_inquiries"),
  (req, res) => inquiryController.deleteInquiry(req, res)
);

router.post(
  "/:id/convert-to-lead",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res) => inquiryController.convertToLead(req, res)
);

export default router;