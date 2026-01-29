import { NextFunction, Request, Response } from 'express';
import { z } from 'zod'; 

export const errorHandler = (
  err: unknown, 
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Unhandled API Error:", err);

  let statusCode = 500;
  let errorResponse: { error: string } = {
    error: "An unexpected error occurred.",
  };

  if (err instanceof z.ZodError) {
    statusCode = 400; 
    errorResponse = {
      error: "Validation error.",
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
        statusCode = 400;
        errorResponse = { error: err.message };
    }
    else {
      statusCode = 500;
      errorResponse = {
        error: err.message,
      };
    }
  }
  else {
    errorResponse = {
      error: "An unknown error occurred.",
    };
  }

  res.status(statusCode).json(errorResponse);
};