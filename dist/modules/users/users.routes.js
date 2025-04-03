"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../../utils/logger");
const isAuthenticated_1 = require("../../middlewares/isAuthenticated");
const router = express_1.default.Router();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            include: {
                role: true,
            },
        });
        res.status(200).json(users);
    }
    catch (err) {
        (0, logger_1.error)("Error during authentication", err);
        res.status(500).json("Error fetching users");
    }
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        if (!password || !name || !email || !role) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: {
                    connect: {
                        name: role,
                    },
                },
            },
        });
        res.status(201).json({ newUser, message: "Successfully created the user" });
    }
    catch (err) {
        (0, logger_1.error)("Error", err);
        res.status(500).json({ error: "Error creating user." });
    }
}));
// Edit User route
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const { name, email, role } = req.body;
    try {
        // Ensure required fields are provided
        if (!name && !email && !role) {
            return res.status(400).json({ error: "No fields provided to update." });
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                role,
            },
        });
        res
            .status(200)
            .json({ updatedUser, message: "User updated successfully." });
    }
    catch (err) {
        (0, logger_1.error)(err);
        res.status(500).json({ error: "Error updating user." });
    }
}));
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        // Ensure that user exists before attempting to delete
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        yield prisma_1.prisma.user.delete({
            where: { id: userId },
        });
        res.status(200).json({ message: "User deleted successfully." });
    }
    catch (err) {
        (0, logger_1.error)(err);
        res.status(500).json({ error: "Error deleting user." });
    }
}));
router.get("/permissions", isAuthenticated_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            include: {
                role: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.status(200).json(user.role.permissions);
    }
    catch (err) {
        (0, logger_1.error)(err);
        res.status(500).json({ error: "Error fetching permissions." });
    }
}));
exports.default = router;
