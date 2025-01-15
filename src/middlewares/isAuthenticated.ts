import { Request, Response, NextFunction } from "express";

interface User {
  id: string;
  role: string;
}

interface CustomRequest extends Request {
  user: User; 
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export const authorizeRole = (role: string) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
      if (req.user && req.user.role === role) {
          return next();
      }
      res.status(403).json({ message: "Forbidden" });
  };
};

