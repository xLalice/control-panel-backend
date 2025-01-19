import express from 'express';
import { User } from '@prisma/client';
import { google } from 'googleapis';
import fs from "fs";

import passport from "passport"
require("dotenv").config();

const router = express.Router();

const CREDENTIALS_PATH =  "./src/credentials/credentials.json";


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

router.get('/google/callback', async (req, res): Promise<any> => {
  try {
      console.log("Entered callback");

      const { code } = req.query;

      if (typeof code !== 'string') {
          return res.status(400).send('Error: Code is missing or invalid');
      }

      // Get the OAuth2 client - Do not call authenticate here
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
      const { client_secret, client_id, redirect_uris } = credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Exchange the code for an access token
      const { tokens } = await oAuth2Client.getToken(code);

      // Set the credentials in the OAuth client
      oAuth2Client.setCredentials(tokens);

      // Save the token to a secure location
      fs.writeFileSync('token.json', JSON.stringify(tokens));

      console.log('Authentication successful! Token saved.');

      res.status(200).send('Authentication successful!');
  } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).send('Authentication failed');
  }
});

export default router;
