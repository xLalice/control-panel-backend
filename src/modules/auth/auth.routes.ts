import express from "express";
import { User } from "@prisma/client";
import { google } from "googleapis";
import fs from "fs";
import { info } from "../../utils/logger";
import passport from "passport";
require("dotenv").config();

const router = express.Router();

router.post("/login", async (req: any, res: any, next) => {
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err: Error) => {
      if (err) {
        return next(err);
      }

      req.session.save((err: Error) => {
        if (err) {
          return next(err);
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    });
  })(req, res, next);
});



router.post("/logout", (req: any, res: any) => {
  req.logout((err: Error) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    req.session.destroy((err: Error) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Error destroying session" });
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.json({ message: "Logged out successfully" });
    });
  });
});

router.get("/verify", (req: any, res: any) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: true,
      user: req.user,
    });
  }

  return res.status(401).json({ authenticated: false, user: req.user });
});

export default router;
