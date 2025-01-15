import express, {Request, Response } from 'express';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import passport from "passport"
require("dotenv").config();

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET){
  throw("No JWT Secret");
}

router.post('/register', async (req: Request, res: Response): Promise<any> => {
  const { email, password, name } = req.body;

  const missingFields = [];
  if (!email) missingFields.push("email");
  if (!password) missingFields.push("password");
  if (!name) missingFields.push("name");

  if (missingFields.length > 0) {
    return res
      .status(400)
      .json({ error: `${missingFields.join(", ")} ${missingFields.length > 1 ? 'are' : 'is'} required` });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Check if name already exists
    const existingName = await prisma.user.findFirst({
      where: { name },
    });

    if (existingName) {
      return res.status(409).json({ error: "Name already exists" });
    }

    // Hash the password and create the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Exclude the password from the response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Prisma-specific error handling for unique constraints
    if (error.code === "P2002") {
      return res.status(409).json({
        error: `A user with this ${error.meta?.target} already exists.`,
      });
    }

    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
});

router.post('/login', async (req: any, res: any, next) => {
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err){
      return next(err);
    }
    if (!user){
      return res.status(401).json({message: info.message});
    }
    req.logIn(user, (err: Error) => {
      if (err){
        return next(err);
      };

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    });
  })(req, res, next);
});

export default router;
