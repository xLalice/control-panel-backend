import { Role } from "@prisma/client/wasm";

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            name: string;
            password: string;
            role: Role | null;
            createdAt: Date;
            updatedAt: Date;
        }
    }
}

export interface FacebookCreds {
    user_access_token: string;
    page_access_token: string;
    page_id: string;
    expiry_date: Date;
  }