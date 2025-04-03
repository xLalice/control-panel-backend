import { Request, Response } from "express";
import { LeadService } from "./lead.service";
import {
  assignLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from "./lead.schema";
import { prisma } from "../../config/prisma";
import { LeadStatus, User } from "@prisma/client";
import { info } from "console";

const leadService = new LeadService(prisma);

export class LeadController {
  async createLead(req: Request, res: Response) {
    try {
      info("Creating lead");
      const validatedData = createLeadSchema.parse(req.body);
      info(validatedData)
      const lead = await leadService.createLead(validatedData);
      info("Created lead: ", lead)
      res.status(201).json(lead);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error);
        res.status(400).json({ error: error.message });
      } else {
        console.error("Unknown error:", error);
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async updateLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await leadService.updateLead(id, validatedData);
      res.json(lead);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error);
        res.status(400).json({ error: error.message });
      } else {
        console.error("Unknown error:", error);
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async updateLeadStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateLeadStatusSchema.parse(req.body);
      const lead = await leadService.updateLeadStatus(id, validatedData);
      res.json(lead);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error);
        res.status(400).json({ error: error.message });
      } else {
        console.error("Unknown error:", error);
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async deleteLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await leadService.deleteLead(id);
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }
  async getLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lead = await leadService.getLead(id);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      res.json(lead);
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async getLeads(req: Request, res: Response) {
    try {
      const filters = req.query;
      console.log("Get leads called with filters:", filters);

      const filteredFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined)
      );

      console.log("Filtered filters:", filteredFilters);

      const leads = await leadService.getLeads(filteredFilters);
      console.log("Leads:", leads);
      res.json(leads);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error:", error);
        res.status(400).json({ error: error.message });
      } else {
        console.error("An unknown error occurred");
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async getCompanies(req: Request, res: Response) {
    try {
      const companies = await leadService.getCompanies();
      res.json(companies);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async assignLead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = assignLeadSchema.parse(req.body);
      const userId = req.user!.id;
      const lead = await leadService.assignLead(id, validatedData, userId);
      res.json(lead);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error);
        res.status(400).json({ error: error.message });
      } else {
        console.error("Unknown error:", error);
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }

  async getLeadActivities(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const activities = await leadService.getLeadActivities(id);
      res.json(activities);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  }
}
