import express from "express";
import { User } from "@prisma/client";
import passport from "passport";
import { getCurrentUser, loginUser, logoutUser } from "./auth.controller";
import { log } from "console";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
require("dotenv").config();

const router = express.Router();

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.get("/me", isAuthenticated, getCurrentUser);

export default router;
