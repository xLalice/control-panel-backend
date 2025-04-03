"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentsController = __importStar(require("./document.controller"));
const multer_1 = __importDefault(require("multer"));
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.post("/categories", (0, rbac_1.createRoleMiddleware)("MANAGE_DOCUMENT_CATEGORIES"), documentsController.createCategory);
router.get("/categories", (0, rbac_1.createRoleMiddleware)("MANAGE_DOCUMENT_CATEGORIES"), documentsController.getCategories);
router.put("/categories/:id", (0, rbac_1.createRoleMiddleware)("MANAGE_DOCUMENT_CATEGORIES"), documentsController.updateCategory);
router.delete("/categories/:id", (0, rbac_1.createRoleMiddleware)("MANAGE_DOCUMENT_CATEGORIES"), documentsController.deleteCategory);
router.post("/upload", (0, rbac_1.createRoleMiddleware)("WRITE_DOCUMENTS"), upload.single("file"), documentsController.uploadDocument);
router.get("/", (0, rbac_1.createRoleMiddleware)("READ_DOCUMENTS"), documentsController.getDocuments);
router.get("/:id", (0, rbac_1.createRoleMiddleware)("READ_DOCUMENTS"), documentsController.getDocumentById);
router.get("/:id/download", (0, rbac_1.createRoleMiddleware)("READ_DOCUMENTS"), documentsController.downloadDocument);
router.get("/:id/preview", (0, rbac_1.createRoleMiddleware)("READ_DOCUMENTS"), documentsController.previewDocument);
router.delete("/:id", (0, rbac_1.createRoleMiddleware)("DELETE_DOCUMENTS"), documentsController.deleteDocument);
exports.default = router;
