import { Router } from "express";
import * as documentsController from "./document.controller";
import multer from "multer";
import { createRoleMiddleware } from "../../middlewares/rbac";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/categories",
  createRoleMiddleware("MANAGE_DOCUMENT_CATEGORIES"),
  documentsController.createCategory
);
router.get(
  "/categories",
  createRoleMiddleware("MANAGE_DOCUMENT_CATEGORIES"),
  documentsController.getCategories
);
router.put(
  "/categories/:id",
  createRoleMiddleware("MANAGE_DOCUMENT_CATEGORIES"),
  documentsController.updateCategory
);
router.delete(
  "/categories/:id",
  createRoleMiddleware("MANAGE_DOCUMENT_CATEGORIES"),
  documentsController.deleteCategory
);

router.post(
  "/upload",
  createRoleMiddleware("WRITE_DOCUMENTS"),
  upload.single("file"),
  documentsController.uploadDocument
);
router.get("/", createRoleMiddleware("READ_DOCUMENTS"), documentsController.getDocuments);
router.get(
  "/:id",
  createRoleMiddleware("READ_DOCUMENTS"),
  documentsController.getDocumentById
);
router.get(
  "/:id/download",
  createRoleMiddleware("READ_DOCUMENTS"),
  documentsController.downloadDocument
);
router.get(
  "/:id/preview",
  createRoleMiddleware("READ_DOCUMENTS"),
  documentsController.previewDocument
);
router.delete(
  "/:id",
  createRoleMiddleware("DELETE_DOCUMENTS"),
  documentsController.deleteDocument
);



export default router;
