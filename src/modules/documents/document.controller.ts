import { Request, Response } from 'express';
import * as documentService from "./document.service"
import asyncHandler from '../../utils/asyncHandler';


export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  
  const category = await documentService.createCategory({ name, description });
  res.status(201).json(category);
});

export const getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await documentService.getCategories();
  res.json(categories);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid category ID' });
    return;
  }
  
  const { name, description } = req.body;
  const category = await documentService.updateCategory(id, { name, description });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid category ID' });
    return;
  }
  
  try {
    await documentService.deleteCategory(id);  
    res.status(204).end();
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.message === 'Cannot delete category with existing documents') {
      res.status(400).json({ error: error.message });
      return;
    }
    
    throw error; // Re-throw to let asyncHandler handle it
  }
});

// Document Controllers
export const uploadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  
  const document = await documentService.uploadDocument({
    file: req.file,
    title,
    categoryId: parsedCategoryId,
    uploadedById: req.body.userId || 'system'
  });
  
  res.status(201).json(document);
});

export const downloadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid document ID' });
    return;
  }
  
  const { filename, fileType, buffer } = await documentService.downloadDocument(id);
  
  // Set headers for file download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', fileType);
  
  // Send the file buffer
  res.send(Buffer.from(buffer));
});

export const previewDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid document ID' });
    return;
  }
 
  const { mimeType, filename, buffer } = await documentService.previewDocument(id);
  
  if (req.headers.accept === 'application/json') {
    res.json({
      mimeType,
      filename,
      buffer: Buffer.from(buffer).toString('base64')
    });
  } else {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }
});

export const getDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  
  const documents = await documentService.getDocuments({ 
    categoryId: isNaN(categoryId as number) ? undefined : categoryId 
  });
  
  res.json(documents);
});

export const getDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid document ID' });
    return;
  }
  
  const document = await documentService.getDocumentById(id);
  
  if (!document) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  
  res.json(document);
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid document ID' });
    return;
  }
  
  await documentService.deleteDocument(id);
  res.status(204).end();
});