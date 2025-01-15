import { Request, Response, NextFunction } from "express";
import { User, Role } from "@prisma/client";
import { RequestHandler } from 'express';

interface PrismaUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role | null;
  createdAt: Date;
  updatedAt: Date;
}



// Extend Express's Request type
interface RequestWithUser extends Request {
  user?: PrismaUser;
}


export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next(); 
  }
  res.status(401).json({ message: "Unauthorized" }); 
};

export const authenticateAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
      const user = req.user as PrismaUser | undefined;
      
      if (!user || user.role !== 'ADMIN') {
          res.status(403).json({ error: 'Access denied: Admins only' });
          return;
      }
      next();
  } catch (error) {
      res.status(403).json({ error: 'Invalid user' });
      return;
  }
};
