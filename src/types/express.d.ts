import { User as PrismaUser, Role } from "@prisma/client";

type AppUser = PrismaUser & {
    role: Role
}

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        export interface User extends AppUser {}
    }
}