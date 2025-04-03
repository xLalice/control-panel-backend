// documents.controller.ts
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as documentService from "./document.service"

// Document Category Controllers
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    
    const category = await documentService.createCategory({ name, description });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await documentService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }
    
    const { name, description } = req.body;
    const category = await documentService.updateCategory(id, { name, description });
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }
    
    await documentService.deleteCategory(id);  
    res.status(204).end();
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.message === 'Cannot delete category with existing documents') {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Document Controllers
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
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
    
    const document = await documentService.uploadDocument({
      file: req.file,
      title,
      categoryId: parsedCategoryId,
      uploadedById: req.body.userId || 'system'
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

export const previewDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid document ID' });
      return;
    }
    
    const { filename, fileType, buffer } = await documentService.downloadDocument(id);
    
    // Set content type for preview
    res.setHeader('Content-Type', fileType);
    
    // Send the file buffer
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({ error: 'Failed to preview document' });
  }
};

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    
    const documents = await documentService.getDocuments({ 
      categoryId: isNaN(categoryId as number) ? undefined : categoryId 
    });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid document ID' });
      return;
    }
    
    await documentService.deleteDocument(id);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};