import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

declare global {
    namespace Express {
        interface User {
            id: string;
        }
    }
}

const prisma = new PrismaClient();

passport.use(
    new LocalStrategy({usernameField: "email"}, async (email: string, password: string, done) => {
        const user = await prisma.user.findUnique({where: {email}});
        if (!user){
            return done(null, false, {message: "Email does not exist."});
        };

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return done(null, false, {message: "Incorrect password"});
        } else {
            return done(null, user);
        }
}));

passport.serializeUser((user , done) => done(null, user.id));

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({where: {id}});
        done(null, user);
    } catch(error){
        done(error);
    }
});


export default passport;