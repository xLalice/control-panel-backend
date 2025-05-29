import express from "express";
import { createClient, getClient, getClients, updateClient } from "./client.controllers";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router = express.Router();

router.get("/", getClients);

router.get("/:id", getClient);

router.post("/", isAuthenticated, createClient);


router.patch("/:id", updateClient);


export default router;