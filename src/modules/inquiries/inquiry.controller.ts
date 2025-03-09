import { Request, Response } from "express";
import { InquiryService } from "./inquiry.service";
import { 
  createInquirySchema, 
  updateInquirySchema, 
  filterInquirySchema,
  inquiryIdSchema
} from "./inquiry.schema";
import { z } from "zod";

const inquiryService = new InquiryService();

const quoteSchema = z.object({
  basePrice: z.number().positive({ message: "Base price must be positive" }),
  totalPrice: z.number().positive({ message: "Total price must be positive" })
});

export class InquiryController {
  /**
   * Get all inquiries with pagination and filtering
   */
  async getInquiries(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = filterInquirySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid filter parameters", details: validationResult.error.format() });
        return;
      }
      
      const filter = validationResult.data;
      
      // Process the "all" value for filters
      const processedFilter = {
        ...filter,
        status: filter.status === "all" ? undefined : filter.status,
        source: filter.source === "all" ? undefined : filter.source,
        productType: filter.productType === "all" ? undefined : filter.productType
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
        res.status(400).json({ error: "Invalid inquiry ID", details: validationResult.error.format() });
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
      const validationResult = z.object({
        email: z.string().email().optional(),
        phoneNumber: z.string().min(10).optional(),
        companyName: z.string().optional()
      }).safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid parameters", details: validationResult.error.format() });
        return;
      }

      const { email, phoneNumber, companyName } = validationResult.data;
      const result = await inquiryService.checkCustomerExists({ email, phoneNumber, companyName });
      
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
        res.status(400).json({ error: "Invalid inquiry data", details: validationResult.error.format() });
        return;
      }
      
      const inquiryData = validationResult.data;
      const inquiry = await inquiryService.create(inquiryData, req.user!.id);
      
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
        res.status(400).json({ error: "Invalid inquiry ID", details: idValidation.error.format() });
        return;
      }
      
      const { id } = idValidation.data;
      
      const dataValidation = updateInquirySchema.safeParse(req.body);
      
      if (!dataValidation.success) {
        res.status(400).json({ error: "Invalid inquiry data", details: dataValidation.error.format() });
        return;
      }
      
      const existingInquiry = await inquiryService.findById(id);
      
      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }
      
      const inquiryData = dataValidation.data;
      const updatedInquiry = await inquiryService.update(id, inquiryData, req.user!.id);
      
      res.json(updatedInquiry);
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
        res.status(400).json({ error: "Invalid inquiry ID", details: idValidation.error.format() });
        return;
      }
      
      const { id } = idValidation.data;
      
      const quoteValidation = quoteSchema.safeParse(req.body);
      
      if (!quoteValidation.success) {
        res.status(400).json({ error: "Invalid quote data", details: quoteValidation.error.format() });
        return;
      }
      
      const existingInquiry = await inquiryService.findById(id);
      
      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }
      
      const quoteDetails = quoteValidation.data;
      const updatedInquiry = await inquiryService.createQuote(id, quoteDetails, req.user!.id);
      
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
        res.status(400).json({ error: "Invalid inquiry ID", details: validationResult.error.format() });
        return;
      }
      
      const { id } = validationResult.data;
      
      const existingInquiry = await inquiryService.findById(id);
      
      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }
      
      const updatedInquiry = await inquiryService.approveInquiry(id, req.user!.id);
      
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
        res.status(400).json({ error: "Invalid inquiry ID", details: idValidation.error.format() });
        return;
      }
      
      const { id } = idValidation.data;
      
      const dateValidation = z.object({
        scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        })
      }).safeParse(req.body);
      
      if (!dateValidation.success) {
        res.status(400).json({ error: "Invalid scheduled date", details: dateValidation.error.format() });
        return;
      }
      
      const existingInquiry = await inquiryService.findById(id);
      
      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }
      
      const { scheduledDate } = dateValidation.data;
      const updatedInquiry = await inquiryService.scheduleInquiry(id, new Date(scheduledDate), req.user!.id);
      
      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error scheduling inquiry:", error);
      res.status(500).json({ error: "Failed to schedule inquiry" });
    }
  }

  /**
   * Fulfill an inquiry
   */
  async fulfillInquiry(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = inquiryIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid inquiry ID", details: validationResult.error.format() });
        return;
      }
      
      const { id } = validationResult.data;
      
      const existingInquiry = await inquiryService.findById(id);
      
      if (!existingInquiry) {
        res.status(404).json({ error: "Inquiry not found" });
        return;
      }
      
      const updatedInquiry = await inquiryService.fulfillInquiry(id, req.user!.id);
      
      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error fulfilling inquiry:", error);
      res.status(500).json({ error: "Failed to fulfill inquiry" });
    }
  }

  /**
   * Delete an inquiry
   */
  async deleteInquiry(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = inquiryIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(400).json({ error: "Invalid inquiry ID", details: validationResult.error.format() });
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
        res.status(400).json({ error: "Invalid inquiry ID", details: validationResult.error.format() });
        return;
      }
      
      const { id } = validationResult.data;
      
      const result = await inquiryService.convertToLead(id, req.user!.id);
      
      res.json({
        message: "Inquiry successfully converted to lead",
        data: result
      });
    } catch (error) {
      console.error("Error converting inquiry to lead:", error);
      if (error instanceof Error && error.message === "Inquiry not found") {
        res.status(404).json({ error: "Inquiry not found" });
      } else {
        res.status(500).json({ error: "Failed to convert inquiry to lead" });
      }
    }
  }
}