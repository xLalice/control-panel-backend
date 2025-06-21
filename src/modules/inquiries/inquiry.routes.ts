import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";

const router = express.Router();
const inquiryController = new InquiryController();

router.post("/check-customer", (req, res, next) =>
  inquiryController.checkCustomerExists(req, res, next)
);

router.get(
  "/",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res, next) => inquiryController.getInquiries(req, res, next)
);

router.get(
  "/stats-overview",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res, next) => inquiryController.getInquiryStatistics(req, res, next)
);

router.get(
  "/:id",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res, next) => inquiryController.getInquiryById(req, res, next)
);

router.post(
  "/",
  isAuthenticated,
  checkPermission("create:inquiry"),
  (req, res, next) => inquiryController.createInquiry(req, res, next)
);

router.put(
  "/:id",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res, next) => inquiryController.updateInquiry(req, res, next)
);

router.delete(
  "/:id",
  isAuthenticated,
  checkPermission("delete:all_inquiries"),
  (req, res, next) => inquiryController.deleteInquiry(req, res, next)
);

router.post(
  "/:id/review",
  isAuthenticated,
  (req, res, next) => inquiryController.reviewInquiry(req, res, next)
);

router.post(
  "/:id/close",
  isAuthenticated,
  (req, res, next) => inquiryController.closeInquiry(req, res, next)
);

router.post(
  "/:id/associate",
  isAuthenticated,
  (req, res, next) => inquiryController.associateInquiry(req, res, next)
);

router.post(
  "/:id/convert-to-lead",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res, next) => inquiryController.convertToLead(req, res, next)
);

router.patch(
  "/:id/assign/",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res, next) => inquiryController.assignInquiry(req, res, next)
);

router.get(
  "/stats/overview",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res, next) => inquiryController.getInquiryStatistics(req, res, next)
);

export default router;