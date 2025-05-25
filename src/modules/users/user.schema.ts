import { z } from "zod/v4";

export const CreateUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.string().min(1, "Role is required"),
});