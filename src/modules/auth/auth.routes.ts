import express from "express";
import { User } from "@prisma/client";
import passport from "passport";
import { getCurrentUser, loginUser, logoutUser } from "./auth.controller";
import { log } from "console";
require("dotenv").config();

const router = express.Router();

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.get("/me", getCurrentUser);

export default router;
