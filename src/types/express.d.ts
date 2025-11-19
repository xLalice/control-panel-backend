import { User as PrismaUser, Role } from "@prisma/client";

declare global {
    namespace Express {
        export interface User extends PrismaUser {
            role: Role;
        }

        export interface Request {
            user?: User; 
        }
    }
}