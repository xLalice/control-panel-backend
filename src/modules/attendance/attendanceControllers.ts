import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import {
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  format,
} from "date-fns";

export const attendanceController = {
  async clockIn(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { device } = req.body;

      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      
      if (user.isOJT) {
        const dtrSettings = await prisma.dTRSettings.findFirst();

        if (dtrSettings && !dtrSettings.allowRemoteLogin) {
          const allowedIP = await prisma.allowedIP.findFirst({
            where: {
              userId,
              ipAddress,
            },
          });

          if (!allowedIP) {
            return res.status(403).json({
              error:
                "Unauthorized location. OJT users must clock in from an approved location.",
            });
          }
        }
      }

      const now = new Date();
      const today = startOfDay(now);

      const existingRecord = await prisma.attendance.findFirst({
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

      const settings = await prisma.dTRSettings.findFirst();

      if (!settings) {
        return res.status(500).json({ error: "DTR settings not configured" });
      }

      const [hours, minutes] = settings.workStartTime.split(":").map(Number);

      
      const todayWorkStart = new Date(today);
      todayWorkStart.setHours(hours);
      todayWorkStart.setMinutes(minutes);

      const minutesLate = differenceInMinutes(now, todayWorkStart);

      let status = "PRESENT";
      if (minutesLate > settings.lateThreshold) {
        status = "LATE";
      }

      const attendanceRecord = await prisma.attendance.create({
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
    } catch (error) {
      console.error("Clock-in error:", error);
      return res.status(500).json({ error: "Failed to record clock-in" });
    }
  },

  async clockOut(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { notes } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const now = new Date();
      const today = startOfDay(now);

      const attendanceRecord = await prisma.attendance.findFirst({
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

      const breaks = await prisma.breakLog.findMany({
        where: {
          attendanceId: attendanceRecord.id,
        },
      });

      let breakDuration = 0;
      for (const breakLog of breaks) {
        if (breakLog.duration) {
          breakDuration += breakLog.duration;
        } else if (breakLog.startTime && !breakLog.endTime) {
          await prisma.breakLog.update({
            where: { id: breakLog.id },
            data: {
              endTime: now,
              duration: parseFloat(
                (differenceInMinutes(now, breakLog.startTime) / 60).toFixed(2)
              ),
            },
          });
          breakDuration += differenceInMinutes(now, breakLog.startTime) / 60;
        }
      }

      const timeIn = attendanceRecord.timeIn;
      const grossHours =
        differenceInHours(now, timeIn) +
        (differenceInMinutes(now, timeIn) % 60) / 60;
      const totalHours = Math.max(
        0,
        parseFloat((grossHours - breakDuration).toFixed(2))
      );

      const updatedRecord = await prisma.attendance.update({
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
    } catch (error) {
      console.error("Clock-out error:", error);
      return res.status(500).json({ error: "Failed to record clock-out" });
    }
  },

  async startBreak(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const now = new Date();
      const today = startOfDay(now);

      const attendanceRecord = await prisma.attendance.findFirst({
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

      const activeBreak = await prisma.breakLog.findFirst({
        where: {
          attendanceId: attendanceRecord.id,
          endTime: null,
        },
      });

      if (activeBreak) {
        return res.status(400).json({ error: "Already on break" });
      }

      await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: { status: "ON_BREAK" },
      });

      const breakLog = await prisma.breakLog.create({
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
    } catch (error) {
      console.error("Start break error:", error);
      return res.status(500).json({ error: "Failed to start break" });
    }
  },

  async endBreak(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const now = new Date();
      const today = startOfDay(now);

      const attendanceRecord = await prisma.attendance.findFirst({
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

      const activeBreak = await prisma.breakLog.findFirst({
        where: {
          attendanceId: attendanceRecord.id,
          endTime: null,
        },
      });

      if (!activeBreak) {
        return res.status(404).json({ error: "No active break found" });
      }

      const breakDuration = parseFloat(
        (differenceInMinutes(now, activeBreak.startTime) / 60).toFixed(2)
      );

      const updatedBreak = await prisma.breakLog.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          duration: breakDuration,
        },
      });

      await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: { status: "PRESENT" },
      });

      return res.status(200).json({
        message: "Break ended successfully",
        data: updatedBreak,
      });
    } catch (error) {
      console.error("End break error:", error);
      return res.status(500).json({ error: "Failed to end break" });
    }
  },

  async getUserAttendance(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999); 
        dateFilter.lte = endDateObj;
      }

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        include: {
          breakLogs: true,
        },
        orderBy: {
          date: "desc",
        },
      });

      return res.status(200).json(attendanceRecords);
    } catch (error) {
      console.error("Get user attendance error:", error);
      return res
        .status(500)
        .json({ error: "Failed to retrieve attendance records" });
    }
  },

  async getAllAttendance(req: Request, res: Response): Promise<any> {
    try {
      const { date, department, status } = req.query;

      const whereClause: any = {};

      if (date) {
        const dateObj = new Date(date as string);
        whereClause.date = {
          gte: startOfDay(dateObj),
          lt: new Date(startOfDay(dateObj).getTime() + 24 * 60 * 60 * 1000),
        };
      }

      if (department) {
        whereClause.user = {
          role: department as string,
        };
      }

      if (status) {
        whereClause.status = status as string;
      }

      const attendanceRecords = await prisma.attendance.findMany({
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
    } catch (error) {
      console.error("Get all attendance error:", error);
      return res
        .status(500)
        .json({ error: "Failed to retrieve attendance records" });
    }
  },

  async updateSettings(req: Request, res: Response): Promise<any> {
    try {
      const updatedById = req.user?.id;
      const {
        workStartTime,
        lateThreshold,
        allowRemoteLogin,
        autoRemindersActive,
      } = req.body;

      if (
        !workStartTime ||
        lateThreshold === undefined ||
        allowRemoteLogin === undefined ||
        autoRemindersActive === undefined ||
        !updatedById
      ) {
        return res
          .status(400)
          .json({ error: "All settings fields are required" });
      }

      const settings = await prisma.dTRSettings.findFirst();

      const updatedSettings = await prisma.dTRSettings.upsert({
        where: {
          id: settings?.id || "default",
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
    } catch (error) {
      console.error("Update settings error:", error);
      return res.status(500).json({ error: "Failed to update DTR settings" });
    }
  },

  async manageAllowedIPs(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      const { ipAddress, description, action } = req.body;

      const currentIpAddress =
        ipAddress ||
        (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (!userId || !action) {
        return res
          .status(400)
          .json({ error: "User ID and action are required" });
      }

      const user = await prisma.user.findUnique({
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
        const existing = await prisma.allowedIP.findFirst({
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
        const allowedIP = await prisma.allowedIP.create({
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
      } else if (action === "remove") {
        await prisma.allowedIP.deleteMany({
          where: {
            userId,
            ipAddress: currentIpAddress,
          },
        });

        return res.status(200).json({
          message: "IP address removed from allowed list",
        });
      } else {
        return res
          .status(400)
          .json({ error: 'Invalid action. Use "add" or "remove"' });
      }
    } catch (error) {
      console.error("Manage allowed IPs error:", error);
      return res.status(500).json({ error: "Failed to manage allowed IPs" });
    }
  },
  
};
