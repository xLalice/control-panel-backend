import { Request, Response } from "express";
import { InquiryService } from "./inquiry.service";
import {
  createInquirySchema,
  updateInquirySchema,
  filterInquirySchema,
  inquiryIdSchema,
  rejectInquirySchema,
  scheduleInquirySchema,
} from "./inquiry.schema";
import { z } from "zod";
import { Priority } from "@prisma/client";
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  InquiryStatus,
} from "./inquiry.types";
import { success } from "zod/v4";

const inquiryService = new InquiryService();

const quoteSchema = z.object({
  basePrice: z.number().positive({ message: "Base price must be positive" }),
  totalPrice: z.number().positive({ message: "Total price must be positive" }),
});

export class InquiryController {
  /**
   * Get all inquiries with pagination and filtering
   */
  async getInquiries(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  }

  /**
   * Get a single inquiry by ID
   */
  async getInquiryById(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      res.status(500).json({ error: "Failed to fetch inquiry" });
    }
  }

  /**
   * Check if customer exists
   */
  async checkCustomerExists(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = z
        .object({
          email: z.string().email().optional(),
          phoneNumber: z.string().min(10).optional(),
          companyName: z.string().optional(),
        })
        .safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid parameters",
          details: validationResult.error.format(),
        });
        return;
      }

      const { email, phoneNumber, companyName } = validationResult.data;
      const result = await inquiryService.checkClientExists({
        email,
        phoneNumber,
        companyName,
      });

      res.json(result);
    } catch (error) {
      console.error("Error checking customer:", error);
      res.status(500).json({ error: "Failed to check customer existence" });
    }
  }

  /**
   * Create a new inquiry
   */
  async createInquiry(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  }

  /**
   * Update an existing inquiry
   */
  async updateInquiry(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  }

  /**
   * Create a quote for an inquiry
   */
  async createQuote(req: Request, res: Response): Promise<void> {
    try {
      const idValidation = inquiryIdSchema.safeParse(req.params);

      if (!idValidation.success) {
        res.status(400).json({
          error: "Invalid inquiry ID",
          details: idValidation.error.format(),
        });
        return;
      }

      const { id } = idValidation.data;

      const quoteValidation = quoteSchema.safeParse(req.body);

      if (!quoteValidation.success) {
        res.status(400).json({
          error: "Invalid quote data",
          details: quoteValidation.error.format(),
        });
        return;
      }

      const existingInquiry = await inquiryService.findById(id);

      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }

      const quoteDetails = quoteValidation.data;
      const updatedInquiry = await inquiryService.createQuote(
        id,
        quoteDetails,
        req.user!.id
      );

      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  }

  /**
   * Approve an inquiry
   */
  async approveInquiry(req: Request, res: Response): Promise<void> {
    try {
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

      const updatedInquiry = await inquiryService.approveInquiry(
        id,
        req.user!.id
      );

      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error approving inquiry:", error);
      res.status(500).json({ error: "Failed to approve inquiry" });
    }
  }

  /**
   * Schedule an inquiry
   */
  async scheduleInquiry(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error scheduling inquiry:", error);
      if (error instanceof Error && error.message === "Inquiry not found") {
        res.status(404).json({ error: "Inquiry not found" });
      } else {
        res.status(500).json({ error: "Failed to schedule inquiry" });
      }
    }
  }

  /**
   * Fulfill an inquiry
   */
  async fulfillInquiry(req: Request, res: Response): Promise<void> {
    try {
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

      const updatedInquiry = await inquiryService.fulfillInquiry(
        id,
        req.user!.id
      );

      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error fulfilling inquiry:", error);
      res.status(500).json({ error: "Failed to fulfill inquiry" });
    }
  }

  /**
   * Cancel an inquiry
   */
  async cancelInquiry(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error cancelling inquiry:", error);
      res.status(500).json({ error: "Failed to cancel inquiry" });
    }
  }

  /**
   * Delete an inquiry
   */
  async deleteInquiry(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  }

  /**
   * Get inquiry statistics
   */
  async getInquiryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const statistics = await inquiryService.getStatistics(
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.json(statistics);
    } catch (error) {
      console.error("Error fetching inquiry statistics:", error);
      res.status(500).json({ error: "Failed to fetch inquiry statistics" });
    }
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error converting inquiry to lead:", error);

      let statusCode = 500; 
      let errorMessage =
        "Failed to convert inquiry to lead. An unexpected error occurred."; 

      if (error instanceof Error) {
        if (error.message === "Inquiry not found") {
          statusCode = 404; 
          errorMessage = "Inquiry not found";
        } else if (
          error.message === "This inquiry is already linked to a lead"
        ) {
          statusCode = 409; 
          errorMessage = "This inquiry is already linked to a lead"; 
        } else if (error.message === "Inquiry is not in a convertible status") {
          statusCode = 400; 
          errorMessage =
            "Inquiry cannot be converted to a lead in its current status. It must be 'New' or 'Quoted'.";
        }
      }
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Update inquiry priority
   */
  async updatePriority(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error updating inquiry priority:", error);
      res.status(500).json({ error: "Failed to update inquiry priority" });
    }
  }

  /**
   * Update inquiry due date
   */
  async updateDueDate(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error updating inquiry due date:", error);
      res.status(500).json({ error: "Failed to update inquiry due date" });
    }
  }

  /**
   * Assign inquiry to user
   */
  async assignInquiry(req: Request, res: Response): Promise<void> {
    try {
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
        assignedToId,
        
      );

      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error assigning inquiry:", error);
      res.status(500).json({ error: "Failed to assign inquiry" });
    }
  }

  /**
   * Get inquiry statistics by type
   */
  async getInquiryStatisticsByType(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const statistics = await inquiryService.getStatistics(
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.json(statistics);
    } catch (error) {
      console.error("Error fetching inquiry type statistics:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch inquiry type statistics" });
    }
  }
}
