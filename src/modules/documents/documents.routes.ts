// documents.routes.ts
import { Router } from "express";
import * as documentsController from "./document.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Document Category routes
router.post("/categories", documentsController.createCategory);
router.get("/categories", documentsController.getCategories);
router.put("/categories/:id", documentsController.updateCategory);
router.delete("/categories/:id", documentsController.deleteCategory);

// Document routes
router.post(
  "/upload",
  upload.single("file"),
  documentsController.uploadDocument
);
router.get("/", documentsController.getDocuments);
router.get("/:id", documentsController.getDocumentById);
router.get("/:id/download", documentsController.downloadDocument);
router.get("/:id/preview", documentsController.previewDocument);
router.delete("/:id", documentsController.deleteDocument);

export default router;
