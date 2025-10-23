import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const zodValidation = (
  schema: ZodSchema,
  target: "body" | "params" | "query"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[target]);
      next();
    } catch (error) {
      next(error);
    }
  };
};
