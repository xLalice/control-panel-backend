import express from "express";
import { createClient, deleteClient, getClient, getClientActivityLog, getClientContactHistory, getClients, logContactHistory, updateClient } from "./client.controllers";
import { isAuthenticated } from "../../middlewares/isAuthenticated";

const router = express.Router();

router.get("/", getClients);

router.get("/:id", getClient);
router.get("/:id/contact-history", getClientContactHistory)
router.get("/:id/activity-log", getClientActivityLog)

router.post("/", isAuthenticated, createClient);
router.post("/:id/contact-history", logContactHistory)


router.patch("/:id", isAuthenticated, updateClient);

router.delete("/:id", isAuthenticated, deleteClient);



export default router;