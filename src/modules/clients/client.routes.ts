import express from "express";
import { createClient, getClient, getClients, updateClient } from "./client.controllers";

const router = express.Router();

router.get("/", getClients);

router.get("/:id", getClient);

router.post("/", createClient);

router.put("/:id", updateClient);


export default router;