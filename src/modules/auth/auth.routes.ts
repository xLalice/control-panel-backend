import express from "express";
import { User } from "@prisma/client";
import { google } from "googleapis";
import fs from "fs";
import { info } from "../../utils/logger";
import passport from "passport";
require("dotenv").config();

const router = express.Router();

const CREDENTIALS_PATH = "./src/credentials/credentials.json";

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

router.get("/google/callback", async (req, res): Promise<any> => {
  try {
    info("Google callback hit");

    const { code } = req.query;

    if (typeof code !== "string") {
      return res.status(400).send("Error: Code is missing or invalid");
    }

    // Get the OAuth2 client - Do not call authenticate here
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Exchange the code for an access token
    const { tokens } = await oAuth2Client.getToken(code);

    // Set the credentials in the OAuth client
    oAuth2Client.setCredentials(tokens);

    // Save the token to a secure location
    fs.writeFileSync("token.json", JSON.stringify(tokens));

    info("Token saved");

    res.status(200).send("Authentication successful!");
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send("Authentication failed");
  }
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

  return res.status(401).json({ authenticated: false });
});

export default router;
