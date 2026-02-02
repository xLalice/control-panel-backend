import { Request } from 'express';


export const getAuthUser = (req: Request) => {
  if (!req.user) {
    throw new Error("User missing from request. Missing 'isAuthenticated' middleware?");
  }
  return req.user; 
};