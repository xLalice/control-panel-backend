import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  SESSION_SECRET: z.string().min(1, "Session secret is required"),
  FRONTEND_URL: z.string().url("Frontend URL must be a valid URL"),

  SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase Service Role Key is required"),
  SUPABASE_BUCKET_NAME: z.string().default("documents"),

  DATABASE_URL: z.string().url().startsWith("postgresql://", "Must be a PostgreSQL URL"),
  DIRECT_URL: z.string().url().startsWith("postgresql://", "Must be a PostgreSQL URL"),

  REDIS_URL: z.string().regex(/^rediss?:\/\//, "Must be a valid Redis URL"),

  RESEND_API_KEY: z.string().startsWith("re_", "Resend API keys usually start with 're_'"),
  DEFAULT_EMAIL: z.string().email("Default email must be a valid email address"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  
  const fieldErrors = _env.error.flatten().fieldErrors;
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    console.error(`  - ${field}: ${errors?.join(", ")}`);
  });

  throw new Error("Invalid environment variables. Check your .env file.");
}

export const env = _env.data;