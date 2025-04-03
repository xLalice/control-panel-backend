import express from "express";
import { prisma } from "../config/prisma";

import { Prisma, LeadStatus } from "@prisma/client";
import { info } from "../utils/logger";

const router = express.Router();



export default router;