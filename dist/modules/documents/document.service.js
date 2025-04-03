"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.downloadDocument = exports.previewDocument = exports.getDocumentById = exports.getDocuments = exports.uploadDocument = exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const prisma_1 = require("../../config/prisma");
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_1 = require("../../config/supabase");
const mime_types_1 = __importDefault(require("mime-types"));
dotenv_1.default.config();
const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
if (!BUCKET_NAME) {
    throw new Error("Missing Supabase bucket name");
}
const PREVIEW_MAX_SIZE = 10 * 1024 * 1024;
const SUPPORTED_PREVIEW_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
];
const createCategory = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.documentCategory.create({
        data,
    });
});
exports.createCategory = createCategory;
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.documentCategory.findMany();
});
exports.getCategories = getCategories;
const getCategoryById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.documentCategory.findUnique({
        where: { id },
    });
});
exports.getCategoryById = getCategoryById;
const updateCategory = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.documentCategory.update({
        where: { id },
        data,
    });
});
exports.updateCategory = updateCategory;
const deleteCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield prisma_1.prisma.document.count({
        where: { categoryId: id },
    });
    if (count > 0) {
        throw new Error("Cannot delete category with existing documents");
    }
    yield prisma_1.prisma.documentCategory.delete({
        where: { id },
    });
});
exports.deleteCategory = deleteCategory;
const uploadDocument = (uploadedData) => __awaiter(void 0, void 0, void 0, function* () {
    const { file, title, categoryId, uploadedById } = uploadedData;
    const category = yield prisma_1.prisma.documentCategory.findUnique({
        where: { id: categoryId },
    });
    if (!category) {
        throw new Error("Category not found");
    }
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const { data: uploadData, error: uploadError } = yield supabase_1.supabase.storage
        .from("documents")
        .upload(uniqueFilename, file.buffer, {
        cacheControl: "3600",
        upsert: false,
    });
    if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error("Upload failed");
    }
    return prisma_1.prisma.document.create({
        data: {
            title,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            filePath: uploadData.path,
            categoryId,
            uploadedById,
        },
    });
});
exports.uploadDocument = uploadDocument;
const getDocuments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.document.findMany({
        where: {
            categoryId: query === null || query === void 0 ? void 0 : query.categoryId,
        },
        include: {
            category: true,
            uploadedBy: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
});
exports.getDocuments = getDocuments;
const getDocumentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.document.findUnique({
        where: { id },
        include: {
            category: true,
            uploadedBy: true,
        },
    });
});
exports.getDocumentById = getDocumentById;
const previewDocument = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield prisma_1.prisma.document.findUnique({
        where: { id },
        select: {
            filePath: true,
            filename: true,
            fileType: true,
            fileSize: true,
        },
    });
    if (!document) {
        throw new Error("Document not found");
    }
    const cleanFilePath = document.filePath.replace(/^documents\//, '');
    if (document.fileSize > PREVIEW_MAX_SIZE) {
        throw new Error("File too large for preview");
    }
    let detectedMimeType = mime_types_1.default.lookup(document.filename) || document.fileType;
    if (!detectedMimeType && document.filename.toLowerCase().endsWith('.pdf')) {
        detectedMimeType = 'application/pdf';
    }
    if (!detectedMimeType) {
        throw new Error("Could not determine file type");
    }
    if (!SUPPORTED_PREVIEW_TYPES.includes(detectedMimeType)) {
        throw new Error("Unsupported file type for preview");
    }
    try {
        const { data, error } = yield supabase_1.supabase.storage
            .from(BUCKET_NAME)
            .download(cleanFilePath);
        if (error) {
            console.error("Supabase download error:", error);
            throw new Error(`Failed to download document: ${error.message || "Unknown error"}`);
        }
        if (!data) {
            throw new Error("No data returned from Supabase storage");
        }
        return {
            mimeType: detectedMimeType,
            filename: document.filename,
            buffer: yield data.arrayBuffer(),
        };
    }
    catch (err) {
        console.error("Unexpected error in previewDocument:", err);
        throw new Error(`Document preview failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
});
exports.previewDocument = previewDocument;
const downloadDocument = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield prisma_1.prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new Error("Document not found");
    }
    const { data, error } = yield supabase_1.supabase.storage
        .from(BUCKET_NAME)
        .download(document.filePath);
    if (error) {
        console.error("Supabase download error:", error);
        throw new Error("Failed to download document");
    }
    return {
        filename: document.filename,
        fileType: document.fileType,
        buffer: yield data.arrayBuffer(),
    };
});
exports.downloadDocument = downloadDocument;
const deleteDocument = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield prisma_1.prisma.document.findUnique({
        where: { id },
    });
    if (!document) {
        throw new Error("Document not found");
    }
    const { error: storageError } = yield supabase_1.supabase.storage
        .from(BUCKET_NAME)
        .remove([document.filePath]);
    if (storageError) {
        console.error("Supabase delete error:", storageError);
        throw new Error("Failed to delete file from storage");
    }
    yield prisma_1.prisma.document.delete({
        where: { id },
    });
});
exports.deleteDocument = deleteDocument;
