import express from "express";
import { InquiryController } from "./inquiry.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";


const router = express.Router();
const inquiryController = new InquiryController();

router.post("/check-customer", (req, res) =>
  inquiryController.checkCustomerExists(req, res)
);

router.get(
  "/",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
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
  (req, res) => inquiryController.getInquiryById(req, res)
);

router.post(
  "/",
  isAuthenticated,
  checkPermission("create:inquiry"),
  (req, res) => inquiryController.createInquiry(req, res)
);

router.put(
  "/:id",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res) => inquiryController.updateInquiry(req, res)
);

router.delete(
  "/:id",
  isAuthenticated,
  checkPermission("delete:all_inquiries"),
  (req, res) => inquiryController.deleteInquiry(req, res)
);

router.post(
  "/:id/review",
  isAuthenticated,
  (req, res) => inquiryController.reviewInquiry(req, res)
)

router.post(
  "/:id/close",
  isAuthenticated,
  (req, res) => inquiryController.closeInquiry(req, res)
)

router.post(
  "/:id/associate",
  isAuthenticated,
  (req, res) => inquiryController.associateInquiry(req, res)
)

router.post(
  "/:id/convert-to-lead",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res) => inquiryController.convertToLead(req, res)
);

router.patch(
  "/:id/assign/",
  isAuthenticated,
  checkPermission("update:all_inquiries"),
  (req, res) => inquiryController.assignInquiry(req, res)
)

router.get(
  "/stats/overview",
  isAuthenticated,
  checkPermission("read:all_inquiries"),
  (req, res) => inquiryController.getInquiryStatistics(req, res)
)

export default router;
