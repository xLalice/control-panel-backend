import { Router } from "express";
import * as documentsController from "./document.controller";
import multer from "multer";
import { checkPermission } from "../../middlewares/authorization";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/categories",
  checkPermission("manage:documents"),
  documentsController.createCategory
);
router.get(
  "/categories",
  checkPermission("manage:documents"),
  documentsController.getCategories
);
router.put(
  "/categories/:id",
  checkPermission("manage:documents"),
  documentsController.updateCategory
);
router.delete(
  "/categories/:id",
  checkPermission("manage:documents"),
  documentsController.deleteCategory
);

router.post(
  "/upload",
  checkPermission("upload:document"),
  upload.single("file"),
  documentsController.uploadDocument
);
router.get(
  "/",
  checkPermission("read:documents"),
  documentsController.getDocuments
);
router.get(
  "/:id",
  checkPermission("read:documents"),
  documentsController.getDocumentById
);
router.get(
  "/:id/download",
  checkPermission("read:documents"),
  documentsController.downloadDocument
);
router.get(
  "/:id/preview",
  checkPermission("read:documents"),
  documentsController.previewDocument
);
router.delete(
  "/:id",
  checkPermission("manage:documents"),
  documentsController.deleteDocument
);

export default router;