import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { LeadService } from "./lead.service";
import {
  assignLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from "./lead.schema";
import { prisma } from "../../config/prisma";
import { LeadStatus } from "@prisma/client";
import {
  LogContactHistoryInput,
  LogContactHistorySchema,
} from "../clients/client.schema";

const leadService = new LeadService(prisma);

export class LeadController {
  createLead = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createLeadSchema.parse(req.body);
    const lead = await leadService.createLead(
      { ...validatedData, status: validatedData.status as LeadStatus },
      req.user!.id
    );
    res.status(201).json(lead);
  });

  updateLead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      res
        .status(401)
        .json({ message: "User not authenticated after middleware." });
      return;
    }
    const userId = req.user.id;

    const validatedData = updateLeadSchema.parse(req.body);
    const lead = await leadService.updateLead(
      id,
      {
        ...validatedData,
        status: validatedData.status as LeadStatus | undefined,
      },
      userId
    );
    res.json(lead);
  });

  updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = updateLeadStatusSchema.parse(req.body);
    const lead = await leadService.updateLeadStatus(
      id,
      { ...validatedData, status: validatedData.status as LeadStatus },
      req.user!.id
    );
    res.json(lead);
  });

  deleteLead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await leadService.deleteLead(id);
    res.status(204).send();
  });

  getLead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const lead = await leadService.getLead(id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(lead);
  });

  getLeads = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const filteredFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined)
    );

    const leads = await leadService.getLeads(filteredFilters);
    res.json(leads);
  });

  getCompanies = asyncHandler(async (req: Request, res: Response) => {
    const companies = await leadService.getCompanies();
    res.json(companies);
  });

  assignLead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = assignLeadSchema.parse(req.body);
    const userId = req.user!.id;
    const lead = await leadService.assignLead(id, validatedData, userId);
    res.json(lead);
  });

  getLeadActivities = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const activities = await leadService.getLeadActivities(id);
    res.json(activities);
  });

  getContactHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const contactHistory = await leadService.getContactHistory(id);
    res.json(contactHistory);
  });

  logContactHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ error: "Unauthorized: User not authenticated." });
      return;
    }
    const dataToValidate = {
      ...req.body,
      entityId: id,
    };

    const validatedData: LogContactHistoryInput =
      LogContactHistorySchema.parse(dataToValidate);

    const { method, summary, outcome, timestamp, entityType } = validatedData;

    const parsedTimestamp = new Date(timestamp);

    const newContactData = {
      method,
      summary,
      outcome,
      timestamp: parsedTimestamp,
      entity: {
        entityId: id,
        entityType: entityType,
      },
      userId: userId,
    };

    const createdContact = await leadService.addContactHistory(
      id,
      newContactData
    );

    res.status(201).json(createdContact);
  });

  convertLeadToClient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const convertedClient = await leadService.convertLeadToClient(
      id,
      req.user?.id!
    );

    res.status(201).json(convertedClient);
  });
}