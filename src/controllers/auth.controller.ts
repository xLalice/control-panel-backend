import { Request, Response, NextFunction } from "express";
import {info } from "../utils/logger";
import { User } from "@prisma/client/wasm";
import { google } from "googleapis";
import fs from "fs";
import passport from "../config/passport";

const CREDENTIALS_PATH = "./src/credentials/credentials.json";

// User Login
export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err: Error) => {
      if (err) return next(err);

      req.session.save((err: Error) => {
        if (err) return next(err);

        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    });
  })(req, res, next);
};

// Google OAuth Callback
export const googleCallback = async (req: Request, res: Response): Promise<any> => {
  try {
    info("Entered callback");

    const { code } = req.query;
    if (typeof code !== "string") {
      return res.status(400).send("Error: Code is missing or invalid");
    }

    // Get OAuth2 client
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Exchange the code for an access token
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save the token securely
    fs.writeFileSync("token.json", JSON.stringify(tokens));

    info("Authentication successful! Token saved.");
    res.status(200).send("Authentication successful!");
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send("Authentication failed");
  }
};

// User Logout
export const logoutUser = (req: Request, res: Response) => {
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
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
};
