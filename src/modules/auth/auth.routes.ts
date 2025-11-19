import express from "express";
import { getCurrentUser, loginUser, logoutUser } from "./auth.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router = express.Router();

router.post("/login", loginUser);

router.post("/logout", logoutUser);

router.get("/me", isAuthenticated, getCurrentUser);

export default router;
