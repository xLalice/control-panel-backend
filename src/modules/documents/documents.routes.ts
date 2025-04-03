import { Router } from "express";
import * as documentsController from "./document.controller";
import multer from "multer";
import { middlewares } from "../../middlewares/rbac";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Document Category routes
router.post("/categories", middlewares.categoryManagement, documentsController.createCategory);
router.get("/categories", middlewares.documentAccess, documentsController.getCategories);
router.put("/categories/:id", middlewares.categoryManagement, documentsController.updateCategory);
router.delete("/categories/:id", middlewares.categoryManagement, documentsController.deleteCategory);

// Document routes
router.post(
  "/upload",
  middlewares.documentUpload,
  upload.single("file"),
  documentsController.uploadDocument
);
router.get("/", middlewares.documentAccess, documentsController.getDocuments);
router.get("/:id", middlewares.documentAccess, documentsController.getDocumentById);
router.get("/:id/download", middlewares.documentAccess, documentsController.downloadDocument);
router.get("/:id/preview", middlewares.documentAccess, documentsController.previewDocument);
router.delete("/:id", middlewares.documentDelete, documentsController.deleteDocument);

export default router;