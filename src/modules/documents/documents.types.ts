import { DocumentCategory, User} from "../../../prisma/generated/prisma/client";

export interface UploadDocumentDto {
  title: string;
  categoryId: number;
  file: Express.Multer.File;
  uploadedById: string;
}

export interface DocumentResponse {
  id: number;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetDocumentsQuery {
  categoryId?: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}