import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidateRequestOptions = {
  params?: ZodSchema;
  query?: ZodSchema;
  body?: ZodSchema;
};

/**
 * Middleware for validating request parameters using Zod schemas
 */
export function validateRequest(options: ValidateRequestOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate params if schema provided
      if (options.params) {
        req.params = options.params.parse(req.params);
      }
      
      // Validate query if schema provided
      if (options.query) {
        req.query = options.query.parse(req.query);
      }
      
      // Validate body if schema provided
      if (options.body) {
        req.body = options.body.parse(req.body);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.format()
        });
      } else {
        console.error("Validation error:", error);
        res.status(500).json({ error: "Server error during validation" });
      }
    }
  };
}