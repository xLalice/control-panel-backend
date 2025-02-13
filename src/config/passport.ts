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
                console.log("No user found with the email:", email);
                return done(null, false, { message: "Email does not exist." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log("Incorrect password attempt for user:", email);
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (error) {
            console.error("Error during authentication:", error);
            return done(error);
        }
    })
);



passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize user by id
  });
  

passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        console.log("User not found during deserialization.");
        return done(null, false); 
      }
      done(null, user);
    } catch (error) {
      console.log("Error deserializing user:", error);
      done(error, null); 
    }
  });
  

export default passport;