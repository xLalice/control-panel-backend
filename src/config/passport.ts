import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { PrismaClient, User as PrismaUser } from "@prisma/client";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: { include: { permissions: true } } },
        });
        if (!user) {
          console.log("No user found with the email:", email);
          return done(null, false, { message: "Email does not exist." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, { id: user.id, roleId: user.roleId });
});

passport.deserializeUser(async (obj: { id: string; roleId: number }, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: obj.id }, 
      include: { role: true },
    });

    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
