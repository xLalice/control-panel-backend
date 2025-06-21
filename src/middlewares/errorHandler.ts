// src/middlewares/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod'; // Make sure to import Zod

/**
 * Global error handling middleware for Express.
 * Catches errors, logs them, and sends an appropriate JSON response.
 * @param err The error object.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const errorHandler = (
  err: unknown, 
  req: Request,
  res: Response,
  next: NextFunction 
) => {
  console.error("Unhandled API Error:", err);

  let statusCode = 500;
  let errorResponse: { error: string; details?: any } = {
    error: "An unexpected error occurred.",
  };

  if (err instanceof z.ZodError) {
    statusCode = 400; 
    errorResponse = {
      error: "Validation error.",
      details: err.format(),
    };
  }
  else if (err instanceof Error) {
    if (err.message.includes("not found")) {
      statusCode = 404; 
      errorResponse = { error: err.message }; 
    }
    else if (err.message.includes("forbidden") || err.message.includes("unauthorized")) {
      statusCode = 403; 
      errorResponse = { error: err.message };
    }
    else if (err.message.includes("invalid input") || err.message.includes("bad request")) {
        statusCode = 400; // Bad Request
        errorResponse = { error: err.message };
    }
    else {
      statusCode = 500;
      errorResponse = {
        error: "Failed operation.",
        details: err.message, 
      };
    }
  }
  else {
    statusCode = 500;
    errorResponse = {
      error: "An unknown error occurred.",
      details: String(err), 
    };
  }

  res.status(statusCode).json(errorResponse);
};