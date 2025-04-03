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
exports.attendanceController = void 0;
const prisma_1 = require("../../config/prisma");
const date_fns_1 = require("date-fns");
exports.attendanceController = {
    clockIn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { device } = req.body;
                const ipAddress = ((_b = req.headers["x-forwarded-for"]) === null || _b === void 0 ? void 0 : _b.split(",")[0].trim()) ||
                    req.socket.remoteAddress ||
                    "unknown";
                if (!userId) {
                    return res.status(400).json({ error: "User ID is required" });
                }
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                if (user.isOJT) {
                    const dtrSettings = yield prisma_1.prisma.dTRSettings.findFirst();
                    if (dtrSettings && !dtrSettings.allowRemoteLogin) {
                        const allowedIP = yield prisma_1.prisma.allowedIP.findFirst({
                            where: {
                                userId,
                                ipAddress,
                            },
                        });
                        if (!allowedIP) {
                            return res.status(403).json({
                                error: "Unauthorized location. OJT users must clock in from an approved location.",
                            });
                        }
                    }
                }
                const now = new Date();
                const today = (0, date_fns_1.startOfDay)(now);
                const existingRecord = yield prisma_1.prisma.attendance.findFirst({
                    where: {
                        userId,
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                });
                if (existingRecord && existingRecord.timeIn) {
                    return res.status(400).json({ error: "Already clocked in today" });
                }
                const settings = yield prisma_1.prisma.dTRSettings.findFirst();
                if (!settings) {
                    return res.status(500).json({ error: "DTR settings not configured" });
                }
                const [hours, minutes] = settings.workStartTime.split(":").map(Number);
                const todayWorkStart = new Date(today);
                todayWorkStart.setHours(hours);
                todayWorkStart.setMinutes(minutes);
                const minutesLate = (0, date_fns_1.differenceInMinutes)(now, todayWorkStart);
                let status = "PRESENT";
                if (minutesLate > settings.lateThreshold) {
                    status = "LATE";
                }
                const attendanceRecord = yield prisma_1.prisma.attendance.create({
                    data: {
                        userId,
                        date: today,
                        timeIn: now,
                        status,
                        ipAddress,
                        device: device || null,
                    },
                });
                return res.status(200).json({
                    message: "Clock-in successful",
                    data: attendanceRecord,
                });
            }
            catch (error) {
                console.error("Clock-in error:", error);
                return res.status(500).json({ error: "Failed to record clock-in" });
            }
        });
    },
    clockOut(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { notes } = req.body;
                if (!userId) {
                    return res.status(400).json({ error: "User ID is required" });
                }
                const now = new Date();
                const today = (0, date_fns_1.startOfDay)(now);
                const attendanceRecord = yield prisma_1.prisma.attendance.findFirst({
                    where: {
                        userId,
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                        timeOut: null,
                    },
                });
                if (!attendanceRecord) {
                    return res
                        .status(404)
                        .json({ error: "No active clock-in record found for today" });
                }
                const breaks = yield prisma_1.prisma.breakLog.findMany({
                    where: {
                        attendanceId: attendanceRecord.id,
                    },
                });
                let breakDuration = 0;
                for (const breakLog of breaks) {
                    if (breakLog.duration) {
                        breakDuration += breakLog.duration;
                    }
                    else if (breakLog.startTime && !breakLog.endTime) {
                        yield prisma_1.prisma.breakLog.update({
                            where: { id: breakLog.id },
                            data: {
                                endTime: now,
                                duration: parseFloat(((0, date_fns_1.differenceInMinutes)(now, breakLog.startTime) / 60).toFixed(2)),
                            },
                        });
                        breakDuration += (0, date_fns_1.differenceInMinutes)(now, breakLog.startTime) / 60;
                    }
                }
                const timeIn = attendanceRecord.timeIn;
                const grossHours = (0, date_fns_1.differenceInHours)(now, timeIn) +
                    ((0, date_fns_1.differenceInMinutes)(now, timeIn) % 60) / 60;
                const totalHours = Math.max(0, parseFloat((grossHours - breakDuration).toFixed(2)));
                const updatedRecord = yield prisma_1.prisma.attendance.update({
                    where: {
                        id: attendanceRecord.id,
                    },
                    data: {
                        timeOut: now,
                        totalHours,
                        status: "LOGGED_OUT",
                        notes: notes || null,
                        updatedAt: now,
                    },
                });
                return res.status(200).json({
                    message: "Clock-out successful",
                    data: updatedRecord,
                });
            }
            catch (error) {
                console.error("Clock-out error:", error);
                return res.status(500).json({ error: "Failed to record clock-out" });
            }
        });
    },
    startBreak(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { reason } = req.body;
                if (!userId) {
                    return res.status(400).json({ error: "User ID is required" });
                }
                const now = new Date();
                const today = (0, date_fns_1.startOfDay)(now);
                const attendanceRecord = yield prisma_1.prisma.attendance.findFirst({
                    where: {
                        userId,
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                        timeOut: null,
                    },
                });
                if (!attendanceRecord) {
                    return res
                        .status(404)
                        .json({ error: "No active clock-in record found for today" });
                }
                const activeBreak = yield prisma_1.prisma.breakLog.findFirst({
                    where: {
                        attendanceId: attendanceRecord.id,
                        endTime: null,
                    },
                });
                if (activeBreak) {
                    return res.status(400).json({ error: "Already on break" });
                }
                yield prisma_1.prisma.attendance.update({
                    where: { id: attendanceRecord.id },
                    data: { status: "ON_BREAK" },
                });
                const breakLog = yield prisma_1.prisma.breakLog.create({
                    data: {
                        attendanceId: attendanceRecord.id,
                        startTime: now,
                        reason: reason || null,
                    },
                });
                return res.status(200).json({
                    message: "Break started successfully",
                    data: breakLog,
                });
            }
            catch (error) {
                console.error("Start break error:", error);
                return res.status(500).json({ error: "Failed to start break" });
            }
        });
    },
    endBreak(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(400).json({ error: "User ID is required" });
                }
                const now = new Date();
                const today = (0, date_fns_1.startOfDay)(now);
                const attendanceRecord = yield prisma_1.prisma.attendance.findFirst({
                    where: {
                        userId,
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                        status: "ON_BREAK",
                    },
                });
                if (!attendanceRecord) {
                    return res.status(404).json({ error: "No active break found" });
                }
                const activeBreak = yield prisma_1.prisma.breakLog.findFirst({
                    where: {
                        attendanceId: attendanceRecord.id,
                        endTime: null,
                    },
                });
                if (!activeBreak) {
                    return res.status(404).json({ error: "No active break found" });
                }
                const breakDuration = parseFloat(((0, date_fns_1.differenceInMinutes)(now, activeBreak.startTime) / 60).toFixed(2));
                const updatedBreak = yield prisma_1.prisma.breakLog.update({
                    where: { id: activeBreak.id },
                    data: {
                        endTime: now,
                        duration: breakDuration,
                    },
                });
                yield prisma_1.prisma.attendance.update({
                    where: { id: attendanceRecord.id },
                    data: { status: "PRESENT" },
                });
                return res.status(200).json({
                    message: "Break ended successfully",
                    data: updatedBreak,
                });
            }
            catch (error) {
                console.error("End break error:", error);
                return res.status(500).json({ error: "Failed to end break" });
            }
        });
    },
    getUserAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { startDate, endDate } = req.query;
                if (!userId) {
                    return res.status(400).json({ error: "User ID is required" });
                }
                const dateFilter = {};
                if (startDate) {
                    dateFilter.gte = new Date(startDate);
                }
                if (endDate) {
                    const endDateObj = new Date(endDate);
                    endDateObj.setHours(23, 59, 59, 999);
                    dateFilter.lte = endDateObj;
                }
                const attendanceRecords = yield prisma_1.prisma.attendance.findMany({
                    where: Object.assign({ userId }, (Object.keys(dateFilter).length > 0 && { date: dateFilter })),
                    include: {
                        breakLogs: true,
                    },
                    orderBy: {
                        date: "desc",
                    },
                });
                return res.status(200).json(attendanceRecords);
            }
            catch (error) {
                console.error("Get user attendance error:", error);
                return res
                    .status(500)
                    .json({ error: "Failed to retrieve attendance records" });
            }
        });
    },
    getAllAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { date, department, status } = req.query;
                const whereClause = {};
                if (date) {
                    const dateObj = new Date(date);
                    whereClause.date = {
                        gte: (0, date_fns_1.startOfDay)(dateObj),
                        lt: new Date((0, date_fns_1.startOfDay)(dateObj).getTime() + 24 * 60 * 60 * 1000),
                    };
                }
                if (department) {
                    whereClause.user = {
                        role: department,
                    };
                }
                if (status) {
                    whereClause.status = status;
                }
                const attendanceRecords = yield prisma_1.prisma.attendance.findMany({
                    where: whereClause,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                isOJT: true,
                            },
                        },
                        breakLogs: true,
                    },
                    orderBy: [{ date: "desc" }, { timeIn: "desc" }],
                });
                return res.status(200).json(attendanceRecords);
            }
            catch (error) {
                console.error("Get all attendance error:", error);
                return res
                    .status(500)
                    .json({ error: "Failed to retrieve attendance records" });
            }
        });
    },
    updateSettings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const updatedById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { workStartTime, lateThreshold, allowRemoteLogin, autoRemindersActive, } = req.body;
                if (!workStartTime ||
                    lateThreshold === undefined ||
                    allowRemoteLogin === undefined ||
                    autoRemindersActive === undefined ||
                    !updatedById) {
                    return res
                        .status(400)
                        .json({ error: "All settings fields are required" });
                }
                const settings = yield prisma_1.prisma.dTRSettings.findFirst();
                const updatedSettings = yield prisma_1.prisma.dTRSettings.upsert({
                    where: {
                        id: (settings === null || settings === void 0 ? void 0 : settings.id) || "default",
                    },
                    update: {
                        workStartTime,
                        lateThreshold: parseInt(lateThreshold.toString()),
                        allowRemoteLogin: Boolean(allowRemoteLogin),
                        autoRemindersActive: Boolean(autoRemindersActive),
                        updatedById,
                        updatedAt: new Date(),
                    },
                    create: {
                        id: "default",
                        workStartTime,
                        lateThreshold: parseInt(lateThreshold.toString()),
                        allowRemoteLogin: Boolean(allowRemoteLogin),
                        autoRemindersActive: Boolean(autoRemindersActive),
                        updatedById,
                    },
                });
                return res.status(200).json({
                    message: "DTR settings updated successfully",
                    data: updatedSettings,
                });
            }
            catch (error) {
                console.error("Update settings error:", error);
                return res.status(500).json({ error: "Failed to update DTR settings" });
            }
        });
    },
    manageAllowedIPs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { ipAddress, description, action } = req.body;
                const currentIpAddress = ipAddress ||
                    ((_b = req.headers["x-forwarded-for"]) === null || _b === void 0 ? void 0 : _b.split(",")[0].trim()) ||
                    req.socket.remoteAddress ||
                    "unknown";
                if (!userId || !action) {
                    return res
                        .status(400)
                        .json({ error: "User ID and action are required" });
                }
                const user = yield prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                if (!user.isOJT) {
                    return res
                        .status(400)
                        .json({ error: "IP restrictions only apply to OJT users" });
                }
                if (action === "add") {
                    const existing = yield prisma_1.prisma.allowedIP.findFirst({
                        where: {
                            userId,
                            ipAddress: currentIpAddress,
                        },
                    });
                    if (existing) {
                        return res
                            .status(400)
                            .json({ error: "IP address already allowed for this user" });
                    }
                    // Add new IP
                    const allowedIP = yield prisma_1.prisma.allowedIP.create({
                        data: {
                            userId,
                            ipAddress: currentIpAddress,
                            description: description || null,
                        },
                    });
                    return res.status(200).json({
                        message: "IP address added to allowed list",
                        data: allowedIP,
                    });
                }
                else if (action === "remove") {
                    yield prisma_1.prisma.allowedIP.deleteMany({
                        where: {
                            userId,
                            ipAddress: currentIpAddress,
                        },
                    });
                    return res.status(200).json({
                        message: "IP address removed from allowed list",
                    });
                }
                else {
                    return res
                        .status(400)
                        .json({ error: 'Invalid action. Use "add" or "remove"' });
                }
            }
            catch (error) {
                console.error("Manage allowed IPs error:", error);
                return res.status(500).json({ error: "Failed to manage allowed IPs" });
            }
        });
    },
};
