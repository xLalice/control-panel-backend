import { Request, Response, NextFunction } from "express";
import ac from "../permissions";

type ActionType = "createOwn" | "readOwn" | "updateOwn" | "deleteOwn" | 
                  "createAny" | "readAny" | "updateAny" | "deleteAny";

const checkPermission = (role: string, resource: string, action: ActionType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permission = ac.can(role)[action](resource); 
    if (!permission.granted) {
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
};

export default checkPermission;
