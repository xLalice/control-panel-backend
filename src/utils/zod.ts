import { ZodError, z } from "zod";

export function handleZodError(error: ZodError) {
  return error.issues.map((issue: z.ZodIssue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
