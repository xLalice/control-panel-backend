import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { info, error } from "../../utils/logger";
import { createRoleMiddleware } from "../../middlewares/rbac";

const router = Router();
const prisma = new PrismaClient();

router.get("/", createRoleMiddleware("READ_REPORTS"), async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reportedBy: {
          select: { name: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const result = reports.map((report) => ({
      id: report.id,
      date: report.date,
      location: report.location,
      taskDetails: report.taskDetails,
      reportedBy: report.reportedBy?.name || "Unknown", 
      createdAt: report.createdAt,
    }));

    res.json(result);
  } catch (err) {
    error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});


router.post("/", createRoleMiddleware("WRITE_REPORTS"), async (req, res): Promise<any> => {
  let { date, department, taskDetails } = req.body;
  const reportedBy = req.user?.id;

  if (!date || !department || !taskDetails || !reportedBy) {
    return res.status(400).json({ error: "Invalid input" });
  }

  department = department.toUpperCase();

  try {
    const newReport = await prisma.report.create({
      data: {
        date: new Date(date),
        taskDetails,
        reportedBy: {
          connect: { id: reportedBy },
        },
      },
    });
    res.json(newReport);
  } catch (err) {
    error("Error: ", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

router.put("/:id", createRoleMiddleware("UPDATE_REPORTS"), async (req, res) => {
  const { id } = req.params;
  const { date, department, taskDetails } = req.body;
  try {
    const updatedReport = await prisma.report.update({
      where: { id },
      data: { date: new Date(date), taskDetails },
    });
    res.json(updatedReport);
  } catch (err) {
    error("Error: ", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.delete("/:id", createRoleMiddleware("DELETE_REPORTS"), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.report.delete({ where: { id } });
    res.json({ message: "Report deleted" });
  } catch (err) {
    error("Error: ", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

export default router;
