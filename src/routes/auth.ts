import express, {Request, Response } from 'express';
import { PrismaClient, User } from '@prisma/client';

import passport from "passport"
require("dotenv").config();

const router = express.Router();


router.post('/login', async (req: any, res: any, next) => {
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err){
      return next(err);
    }
    if (!user){
      return res.status(401).json({message: info.message});
    }
    req.logIn(user, (err: Error) => {
      if (err) {
        return next(err); // Handle login errors
      }

      req.session.save((err: Error) => {  // Explicitly save the session
        if (err) {
          return next(err);  // Handle session saving errors
        }

        // Remove the password from the user object for the response
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);  // Send the user data back
      });
    });
  })(req, res, next);
});

export default router;
