import { Document, DocumentCategory } from "@prisma/client";
import { prisma } from "../../config/prisma";
import {
  UploadDocumentDto,
  GetDocumentsQuery,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./documents.types";
import dotenv from "dotenv";
import { supabase } from "../../config/supabase";
import mime from "mime-types";

dotenv.config();

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

export const createCategory = async (
  data: CreateCategoryDto
): Promise<DocumentCategory> => {
  return prisma.documentCategory.create({
    data,
  });
};

export const getCategories = async (): Promise<DocumentCategory[]> => {
  return prisma.documentCategory.findMany();
};

export const getCategoryById = async (
  id: number
): Promise<DocumentCategory | null> => {
  return prisma.documentCategory.findUnique({
    where: { id },
  });
};

export const updateCategory = async (
  id: number,
  data: UpdateCategoryDto
): Promise<DocumentCategory> => {
  return prisma.documentCategory.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: number): Promise<void> => {
  const count = await prisma.document.count({
    where: { categoryId: id },
  });

  if (count > 0) {
    throw new Error("Cannot delete category with existing documents");
  }

  await prisma.documentCategory.delete({
    where: { id },
  });
};

export const uploadDocument = async (
  uploadedData: UploadDocumentDto
): Promise<Document> => {
  const { file, title, categoryId, uploadedById } = uploadedData;

  const category = await prisma.documentCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new Error("Category not found");
  }

  const uniqueFilename = `${Date.now()}-${file.originalname}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(uniqueFilename, file.buffer, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    throw new Error("Upload failed");
  }

  return prisma.document.create({
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
};

export const getDocuments = async (
  query?: GetDocumentsQuery
): Promise<Document[]> => {
  return prisma.document.findMany({
    where: {
      categoryId: query?.categoryId,
    },
    include: {
      category: true,
      uploadedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getDocumentById = async (id: number): Promise<Document | null> => {
  return prisma.document.findUnique({
    where: { id },
    include: {
      category: true,
      uploadedBy: true,
    },
  });
};

export const previewDocument = async (
  id: number
): Promise<{ mimeType: string; filename: string; buffer: ArrayBuffer }> => {
  const document = await prisma.document.findUnique({
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
  
  let detectedMimeType = mime.lookup(document.filename) || document.fileType;
  
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
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(cleanFilePath);
      
    if (error) {
      console.error("Supabase download error:", error);
      throw new Error(
        `Failed to download document: ${error.message || "Unknown error"}`
      );
    }
    
    if (!data) {
      throw new Error("No data returned from Supabase storage");
    }
    
    return {
      mimeType: detectedMimeType,
      filename: document.filename,
      buffer: await data.arrayBuffer(),
    };
  } catch (err) {
    console.error("Unexpected error in previewDocument:", err);
    throw new Error(
      `Document preview failed: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
};


export const downloadDocument = async (
  id: number
): Promise<{
  filename: string;
  fileType: string;
  buffer: ArrayBuffer;
}> => {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(document.filePath);

  if (error) {
    console.error("Supabase download error:", error);
    throw new Error("Failed to download document");
  }

  return {
    filename: document.filename,
    fileType: document.fileType,
    buffer: await data.arrayBuffer(),
  };
};

export const deleteDocument = async (id: number): Promise<void> => {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([document.filePath]);

  if (storageError) {
    console.error("Supabase delete error:", storageError);
    throw new Error("Failed to delete file from storage");
  }

  await prisma.document.delete({
    where: { id },
  });
};
