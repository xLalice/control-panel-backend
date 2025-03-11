// documents.service.ts
import { PrismaClient, Document, DocumentCategory } from '@prisma/client';
import { 
  UploadDocumentDto, 
  GetDocumentsQuery, 
  CreateCategoryDto,
  UpdateCategoryDto
} from './documents.types';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const createCategory = async (data: CreateCategoryDto): Promise<DocumentCategory> => {
  return prisma.documentCategory.create({
    data
  });
};

export const getCategories = async (): Promise<DocumentCategory[]> => {
  return prisma.documentCategory.findMany();
};

export const getCategoryById = async (id: number): Promise<DocumentCategory | null> => {
  return prisma.documentCategory.findUnique({
    where: { id }
  });
};

export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<DocumentCategory> => {
  return prisma.documentCategory.update({
    where: { id },
    data
  });
};

export const deleteCategory = async (id: number): Promise<void> => {
  // Check if category has documents
  const count = await prisma.document.count({
    where: { categoryId: id }
  });
  
  if (count > 0) {
    throw new Error('Cannot delete category with existing documents');
  }
  
  await prisma.documentCategory.delete({
    where: { id }
  });
};

// Document Services
export const uploadDocument = async (data: UploadDocumentDto): Promise<Document> => {
  const { file, title, categoryId, uploadedById } = data;
  
  // Get category to use the name for folder structure
  const category = await prisma.documentCategory.findUnique({
    where: { id: categoryId }
  });
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Create category folder if it doesn't exist
  const categoryPath = path.join(UPLOAD_DIR, category.name.replace(/\s+/g, '-').toLowerCase());
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
  
  // Generate unique filename
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const filePath = path.join(category.name.replace(/\s+/g, '-').toLowerCase(), filename);
  const fullPath = path.join(UPLOAD_DIR, filePath);
  
  // Save file to disk
  await fs.promises.writeFile(fullPath, file.buffer);
  
  // Save document info to database
  return prisma.document.create({
    data: {
      title,
      filename,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath,
      categoryId,
      uploadedById
    }
  });
};

export const getDocuments = async (query?: GetDocumentsQuery): Promise<Document[]> => {
  return prisma.document.findMany({
    where: {
      categoryId: query?.categoryId
    },
    include: {
      category: true,
      uploadedBy: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getDocumentById = async (id: number): Promise<Document | null> => {
  return prisma.document.findUnique({
    where: { id },
    include: {
      category: true,
      uploadedBy: true
    }
  });
};

export const getDocumentFilePath = (document: Document): string => {
  return path.join(UPLOAD_DIR, document.filePath);
};

export const deleteDocument = async (id: number): Promise<void> => {
  const document = await prisma.document.findUnique({
    where: { id }
  });
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Delete file from disk
  const filePath = path.join(UPLOAD_DIR, document.filePath);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
  
  // Delete from database
  await prisma.document.delete({
    where: { id }
  });
};