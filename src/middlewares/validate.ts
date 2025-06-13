import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z } from "zod";
import { success, ZodError } from "zod/v4";

export const validate =
  (schema: AnyZodObject, data: "params" | "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(data === "params" ? req.params : req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string[] } = {};
        const formErrors: string[] = [];

        error.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            const fieldName = issue.path.join("."); 
            if (!fieldErrors[fieldName]) {
              fieldErrors[fieldName] = [];
            }
            fieldErrors[fieldName].push(issue.message);
          } else {
            formErrors.push(issue.message);
          }
        });

        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            fieldErrors,
            formErrors,
          },
        });
      }
      next(error);
    }
  };
