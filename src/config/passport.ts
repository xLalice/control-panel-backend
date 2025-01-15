import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

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

passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email: string, password: string, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return done(null, false, { message: "Email does not exist." });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return done(null, false, { message: "Incorrect password" });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id }
        });
        
        if (!user) {
            return done(null, false);
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
});

export default passport;