import { Request, Response } from "express";
import { InquiryService } from "./inquiry.service";
import {
  createInquirySchema,
  filterInquirySchema,
  inquiryIdSchema,
  scheduleInquirySchema,
  UpdateInquiryDto,
  CreateInquiryDto,
  rejectInquirySchema,
  updateInquirySchema,
  associateInquiryDataSchema,
} from "./inquiry.schema";
import { z } from "zod";
import { Inquiry, InquiryStatus, Priority } from "@prisma/client";

const inquiryService = new InquiryService();

export class InquiryController {
  /**
   * Get all inquiries with pagination and filtering
   */
  async getInquiries(req: Request, res: Response): Promise<void> {
    const validationResult = filterInquirySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid filter parameters",
        details: validationResult.error.format(),
      });
      return;
    }

    const filter = validationResult.data;

    const processedFilter = {
      ...filter,
      status: !filter.status ? undefined : filter.status,
      source: filter.source === "all" ? undefined : filter.source,
      productType: !filter.productType ? undefined : filter.productType,
      inquiryType: !filter.inquiryType ? undefined : filter.inquiryType,
    };

    const inquiries = await inquiryService.findAll(processedFilter);

    res.json(inquiries);
  }

  /**
   * Get a single inquiry by ID
   */
  async getInquiryById(req: Request, res: Response): Promise<void> {
    const validationResult = inquiryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: validationResult.error.format(),
      });
      return;
    }

    const { id } = validationResult.data;
    const inquiry = await inquiryService.findById(id);

    if (!inquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    res.json(inquiry);
  }

  /**
   * Check if customer exists
   */
  async checkCustomerExists(req: Request, res: Response): Promise<void> {
    const validationResult = z
      .object({
        email: z.string().email().optional(),
        phoneNumber: z.string().min(10).optional(),
        companyName: z.string().optional(),
        clientName: z.string().optional(),
      })
      .safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid parameters",
        details: validationResult.error.format(),
      });
      return;
    }

    const { email, phoneNumber, companyName, clientName } =
      validationResult.data;
    const result = await inquiryService.checkClientExists({
      email,
      phoneNumber,
      companyName,
      clientName,
    });

    res.json(result);
  }

  /**
   * Create a new inquiry
   */
  async createInquiry(req: Request, res: Response): Promise<void> {
    const validationResult = createInquirySchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry data",
        details: validationResult.error.format(),
      });
      return;
    }

    const inquiryData = validationResult.data;
    const formattedInquiryData: CreateInquiryDto = {
      ...inquiryData,
      status: InquiryStatus.New,
      priority: inquiryData.priority ?? Priority.Low,
    };

    const inquiry = await inquiryService.create(
      formattedInquiryData,
      req.user!.id
    );

    res.status(201).json(inquiry);
  }

  /**
   * Update an existing inquiry
   */
  async updateInquiry(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const dataValidation = updateInquirySchema.safeParse(req.body);

    if (!dataValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry data",
        details: dataValidation.error.format(),
      });
      return;
    }

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const inquiryData = dataValidation.data;
    const formattedUpdateData: UpdateInquiryDto = {
      ...inquiryData,
      status: inquiryData.status as InquiryStatus | undefined,
    };

    const inquiry = await inquiryService.update(
      req.params.id,
      formattedUpdateData,
      req.user!.id
    );

    res.json(inquiry);
  }

  /**
   * Schedule an inquiry
   */
  async scheduleInquiry(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }
    const { id } = idValidation.data;
    const scheduleDataValidation = scheduleInquirySchema.safeParse(req.body);

    if (!scheduleDataValidation.success) {
      res.status(400).json({
        error: "Invalid schedule data",
        details: scheduleDataValidation.error.format(),
      });
      return;
    }
    const { scheduledDate, priority, notes, reminderMinutes } =
      scheduleDataValidation.data;

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const updatedInquiry = await inquiryService.scheduleInquiry(
      id,
      new Date(scheduledDate),
      req.user!.id,
      {
        priority,
        notes,
        reminderMinutes,
      }
    );

    res.json(updatedInquiry);
  }

  /**
   * Cancel an inquiry
   */
  async cancelInquiry(req: Request, res: Response): Promise<void> {
    const validationResult = rejectInquirySchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: validationResult.error.format(),
      });
      return;
    }

    const { id } = validationResult.data;

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const updatedInquiry = await inquiryService.cancelInquiry(
      id,
      req.user!.id
    );

    res.json(updatedInquiry);
  }

  /**
   * Delete an inquiry
   */
  async deleteInquiry(req: Request, res: Response): Promise<void> {
    const validationResult = inquiryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: validationResult.error.format(),
      });
      return;
    }

    const { id } = validationResult.data;

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    await inquiryService.delete(id);

    res.json({ message: "Inquiry deleted successfully" });
  }

  async associateInquiry(req: Request, res: Response): Promise<void> {
    const validationResult = inquiryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: validationResult.error.format(),
      });
      return;
    }

    const { id } = validationResult.data;

    const dataValidation = associateInquiryDataSchema.safeParse(req.body);

    if (!dataValidation.success) {
      res.status(400).json({
        error: "Invalid association data",
        details: dataValidation.error.format(),
      });
      return;
    }

    const associationData = dataValidation.data;

    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ error: "Unauthorized: User ID not found in request." });
      return;
    }

    const updatedInquiry = await inquiryService.associateInquiry(
      id,
      associationData,
      userId
    );

    res.json(updatedInquiry);
  }

  /**
   * Get inquiry statistics
   */
  async getInquiryStatistics(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;

    const statistics = await inquiryService.getStatistics(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json(statistics);
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(req: Request, res: Response): Promise<void> {
    const validationResult = inquiryIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: validationResult.error.format(),
      });
      return;
    }

    const { id } = validationResult.data;

    const result = await inquiryService.convertToLead(id, req.user!.id);

    res.json({
      success: true,
      message: "Inquiry successfully converted to lead",
      data: result,
    });
  }

  /**
   * Update inquiry priority
   */
  async updatePriority(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const priorityValidation = z
      .object({
        priority: z.enum(["Low", "Medium", "High", "Urgent"]),
      })
      .safeParse(req.body);

    if (!priorityValidation.success) {
      res.status(400).json({
        error: "Invalid priority",
        details: priorityValidation.error.format(),
      });
      return;
    }

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const { priority } = priorityValidation.data;
    const updatedInquiry = await inquiryService.updatePriority(
      id,
      priority,
      req.user!.id
    );

    res.json(updatedInquiry);
  }

  /**
   * Update inquiry due date
   */
  async updateDueDate(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const dueDateValidation = z
      .object({
        dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }),
      })
      .safeParse(req.body);

    if (!dueDateValidation.success) {
      res.status(400).json({
        error: "Invalid due date",
        details: dueDateValidation.error.format(),
      });
      return;
    }

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const { dueDate } = dueDateValidation.data;
    const updatedInquiry = await inquiryService.updateDueDate(
      id,
      new Date(dueDate),
      req.user!.id
    );

    res.json(updatedInquiry);
  }

  /**
   * Assign inquiry to user
   */
  async assignInquiry(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const assignValidation = z
      .object({
        assignedToId: z.string().cuid().nullable(),
      })
      .safeParse(req.body);

    if (!assignValidation.success) {
      res.status(400).json({
        error: "Invalid user ID",
        details: assignValidation.error.format(),
      });
      return;
    }

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const { assignedToId } = assignValidation.data;
    const updatedInquiry = await inquiryService.assignInquiry(
      id,
      req.user!.id,
      assignedToId
    );

    res.json(updatedInquiry);
  }

  async reviewInquiry(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const reviewedInquiry = await inquiryService.reviewInquiry(
      id,
      req.user?.id!
    );

    res.json(reviewedInquiry);
  }

  async closeInquiry(req: Request, res: Response): Promise<void> {
    const idValidation = inquiryIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        error: "Invalid inquiry ID",
        details: idValidation.error.format(),
      });
      return;
    }

    const { id } = idValidation.data;

    const existingInquiry = await inquiryService.findById(id);

    if (!existingInquiry) {
      res.status(404).json({ error: "Inquiry not found" });
      return;
    }

    const closedInquiry = await inquiryService.closeInquiry(
      id,
      req.user?.id!
    );

    res.json(closedInquiry);
  }

  /**
   * Get inquiry statistics by type
   */
  async getInquiryStatisticsByType(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;

    const statistics = await inquiryService.getStatistics(
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json(statistics);
  }
}