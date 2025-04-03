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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.getDocumentById = exports.getDocuments = exports.previewDocument = exports.downloadDocument = exports.uploadDocument = exports.deleteCategory = exports.updateCategory = exports.getCategories = exports.createCategory = void 0;
const documentService = __importStar(require("./document.service"));
// Document Category Controllers
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }
        const category = yield documentService.createCategory({ name, description });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
exports.createCategory = createCategory;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield documentService.getCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
exports.getCategories = getCategories;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid category ID' });
            return;
        }
        const { name, description } = req.body;
        const category = yield documentService.updateCategory(id, { name, description });
        res.json(category);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid category ID' });
            return;
        }
        yield documentService.deleteCategory(id);
        res.status(204).end();
    }
    catch (error) {
        console.error('Error deleting category:', error);
        if (error.message === 'Cannot delete category with existing documents') {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
exports.deleteCategory = deleteCategory;
// Document Controllers
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const { title, categoryId } = req.body;
        const parsedCategoryId = parseInt(categoryId);
        if (!title) {
            res.status(400).json({ error: 'Document title is required' });
            return;
        }
        if (isNaN(parsedCategoryId)) {
            res.status(400).json({ error: 'Invalid category ID' });
            return;
        }
        const document = yield documentService.uploadDocument({
            file: req.file,
            title,
            categoryId: parsedCategoryId,
            uploadedById: req.body.userId || 'system'
        });
        res.status(201).json(document);
    }
    catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});
exports.uploadDocument = uploadDocument;
const downloadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid document ID' });
            return;
        }
        const { filename, fileType, buffer } = yield documentService.downloadDocument(id);
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', fileType);
        // Send the file buffer
        res.send(Buffer.from(buffer));
    }
    catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});
exports.downloadDocument = downloadDocument;
const previewDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid document ID' });
            return;
        }
        const { mimeType, filename, buffer } = yield documentService.previewDocument(id);
        if (req.headers.accept === 'application/json') {
            res.json({
                mimeType,
                filename,
                buffer: Buffer.from(buffer).toString('base64')
            });
        }
        else {
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.send(Buffer.from(buffer));
        }
    }
    catch (error) {
        console.error('Error previewing document:', error);
        res.status(500).json({
            error: 'Failed to preview document',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.previewDocument = previewDocument;
const getDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
        const documents = yield documentService.getDocuments({
            categoryId: isNaN(categoryId) ? undefined : categoryId
        });
        res.json(documents);
    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});
exports.getDocuments = getDocuments;
const getDocumentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid document ID' });
            return;
        }
        const document = yield documentService.getDocumentById(id);
        if (!document) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        res.json(document);
    }
    catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});
exports.getDocumentById = getDocumentById;
const deleteDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid document ID' });
            return;
        }
        yield documentService.deleteDocument(id);
        res.status(204).end();
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});
exports.deleteDocument = deleteDocument;
