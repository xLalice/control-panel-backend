import { Request } from 'express';
import { User } from '@prisma/client';

export const getAuthUser = (req: Request): User => {
  if (!req.user) {
    throw new Error("User missing from request. Missing 'isAuthenticated' middleware?");
  }
  return req.user as User; 
};