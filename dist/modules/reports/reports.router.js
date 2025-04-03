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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const rbac_1 = require("../../middlewares/rbac");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get("/", (0, rbac_1.createRoleMiddleware)("READ_REPORTS"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield prisma.report.findMany({
            include: {
                reportedBy: {
                    select: { name: true },
                },
            },
            orderBy: {
                date: "asc",
            },
        });
        const result = reports.map((report) => {
            var _a;
            return ({
                id: report.id,
                date: report.date,
                location: report.location,
                taskDetails: report.taskDetails,
                reportedBy: ((_a = report.reportedBy) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                createdAt: report.createdAt,
            });
        });
        res.json(result);
    }
    catch (err) {
        (0, logger_1.error)("Error fetching reports:", logger_1.error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
}));
router.post("/", (0, rbac_1.createRoleMiddleware)("WRITE_REPORTS"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { date, department, taskDetails } = req.body;
    const reportedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!date || !department || !taskDetails || !reportedBy) {
        return res.status(400).json({ error: "Invalid input" });
    }
    department = department.toUpperCase();
    try {
        const newReport = yield prisma.report.create({
            data: {
                date: new Date(date),
                taskDetails,
                reportedBy: {
                    connect: { id: reportedBy },
                },
            },
        });
        res.json(newReport);
    }
    catch (err) {
        (0, logger_1.error)("Error: ", err);
        res.status(500).json({ error: "Failed to create report" });
    }
}));
router.put("/:id", (0, rbac_1.createRoleMiddleware)("UPDATE_REPORTS"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { date, department, taskDetails } = req.body;
    try {
        const updatedReport = yield prisma.report.update({
            where: { id },
            data: { date: new Date(date), taskDetails },
        });
        res.json(updatedReport);
    }
    catch (err) {
        (0, logger_1.error)("Error: ", err);
        res.status(500).json({ error: "Failed to update report" });
    }
}));
router.delete("/:id", (0, rbac_1.createRoleMiddleware)("DELETE_REPORTS"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.report.delete({ where: { id } });
        res.json({ message: "Report deleted" });
    }
    catch (err) {
        (0, logger_1.error)("Error: ", err);
        res.status(500).json({ error: "Failed to delete report" });
    }
}));
exports.default = router;
