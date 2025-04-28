import express from "express";
import { prisma } from "../../config/prisma";
import { error, info } from "../../utils/logger";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { checkPermission } from "../../middlewares/authorization";
import { createNewUser, deleteUser, getAllPermissions, getRoles, getUsers, updateUser } from "./users.controller";
import { getActiveResourcesInfo } from "process";

const router = express.Router();

router.get("/", checkPermission("read:users"), getUsers);

router.get("/roles", checkPermission("read:users"), getRoles);

router.post("/", checkPermission("manage:users"), createNewUser);

router.put("/:id", checkPermission("manage:users"), updateUser);

router.delete("/:id", checkPermission("manage:users"), deleteUser);

router.get("/permissions", checkPermission("manage:users"), isAuthenticated, getAllPermissions);

export default router;
