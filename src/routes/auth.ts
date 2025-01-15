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
