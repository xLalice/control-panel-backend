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
exports.InquiryController = void 0;
const inquiry_service_1 = require("./inquiry.service");
const inquiry_schema_1 = require("./inquiry.schema");
const zod_1 = require("zod");
const inquiryService = new inquiry_service_1.InquiryService();
const quoteSchema = zod_1.z.object({
    basePrice: zod_1.z.number().positive({ message: "Base price must be positive" }),
    totalPrice: zod_1.z.number().positive({ message: "Total price must be positive" }),
});
class InquiryController {
    /**
     * Get all inquiries with pagination and filtering
     */
    getInquiries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.filterInquirySchema.safeParse(req.query);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid filter parameters",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const filter = validationResult.data;
                const processedFilter = Object.assign(Object.assign({}, filter), { status: !filter.status ? undefined : filter.status, source: filter.source === "all" ? undefined : filter.source, productType: !filter.productType ? undefined : filter.productType, inquiryType: !filter.inquiryType ? undefined : filter.inquiryType });
                const inquiries = yield inquiryService.findAll(processedFilter);
                res.json(inquiries);
            }
            catch (error) {
                console.error("Error fetching inquiries:", error);
                res.status(500).json({ error: "Failed to fetch inquiries" });
            }
        });
    }
    /**
     * Get a single inquiry by ID
     */
    getInquiryById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const inquiry = yield inquiryService.findById(id);
                if (!inquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                res.json(inquiry);
            }
            catch (error) {
                console.error("Error fetching inquiry:", error);
                res.status(500).json({ error: "Failed to fetch inquiry" });
            }
        });
    }
    /**
     * Check if customer exists
     */
    checkCustomerExists(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = zod_1.z
                    .object({
                    email: zod_1.z.string().email().optional(),
                    phoneNumber: zod_1.z.string().min(10).optional(),
                    companyName: zod_1.z.string().optional(),
                })
                    .safeParse(req.body);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid parameters",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { email, phoneNumber, companyName } = validationResult.data;
                const result = yield inquiryService.checkCustomerExists({
                    email,
                    phoneNumber,
                    companyName,
                });
                res.json(result);
            }
            catch (error) {
                console.error("Error checking customer:", error);
                res.status(500).json({ error: "Failed to check customer existence" });
            }
        });
    }
    /**
     * Create a new inquiry
     */
    createInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.createInquirySchema.safeParse(req.body);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry data",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const inquiryData = validationResult.data;
                const formattedInquiryData = Object.assign(Object.assign({}, inquiryData), { priority: inquiryData.priority || undefined });
                const inquiry = yield inquiryService.create(formattedInquiryData, req.user.id);
                res.status(201).json(inquiry);
            }
            catch (error) {
                console.error("Error creating inquiry:", error);
                res.status(500).json({ error: "Failed to create inquiry" });
            }
        });
    }
    /**
     * Update an existing inquiry
     */
    updateInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const dataValidation = inquiry_schema_1.updateInquirySchema.safeParse(req.body);
                if (!dataValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry data",
                        details: dataValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const inquiryData = dataValidation.data;
                const updatedInquiry = yield inquiryService.update(id, inquiryData, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error updating inquiry:", error);
                res.status(500).json({ error: "Failed to update inquiry" });
            }
        });
    }
    /**
     * Create a quote for an inquiry
     */
    createQuote(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const quoteValidation = quoteSchema.safeParse(req.body);
                if (!quoteValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid quote data",
                        details: quoteValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const quoteDetails = quoteValidation.data;
                const updatedInquiry = yield inquiryService.createQuote(id, quoteDetails, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error creating quote:", error);
                res.status(500).json({ error: "Failed to create quote" });
            }
        });
    }
    /**
     * Approve an inquiry
     */
    approveInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const updatedInquiry = yield inquiryService.approveInquiry(id, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error approving inquiry:", error);
                res.status(500).json({ error: "Failed to approve inquiry" });
            }
        });
    }
    /**
     * Schedule an inquiry
     */
    scheduleInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const dateValidation = zod_1.z
                    .object({
                    scheduledDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
                        message: "Invalid date format",
                    }),
                })
                    .safeParse(req.body);
                if (!dateValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid scheduled date",
                        details: dateValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const { scheduledDate } = dateValidation.data;
                const updatedInquiry = yield inquiryService.scheduleInquiry(id, new Date(scheduledDate), req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error scheduling inquiry:", error);
                res.status(500).json({ error: "Failed to schedule inquiry" });
            }
        });
    }
    /**
     * Fulfill an inquiry
     */
    fulfillInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const updatedInquiry = yield inquiryService.fulfillInquiry(id, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error fulfilling inquiry:", error);
                res.status(500).json({ error: "Failed to fulfill inquiry" });
            }
        });
    }
    /**
     * Cancel an inquiry
     */
    cancelInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.rejectInquirySchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const updatedInquiry = yield inquiryService.cancelInquiry(id, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error cancelling inquiry:", error);
                res.status(500).json({ error: "Failed to cancel inquiry" });
            }
        });
    }
    /**
     * Delete an inquiry
     */
    deleteInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                yield inquiryService.delete(id);
                res.json({ message: "Inquiry deleted successfully" });
            }
            catch (error) {
                console.error("Error deleting inquiry:", error);
                res.status(500).json({ error: "Failed to delete inquiry" });
            }
        });
    }
    /**
     * Get inquiry statistics
     */
    getInquiryStatistics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate } = req.query;
                const statistics = yield inquiryService.getStatistics(startDate, endDate);
                res.json(statistics);
            }
            catch (error) {
                console.error("Error fetching inquiry statistics:", error);
                res.status(500).json({ error: "Failed to fetch inquiry statistics" });
            }
        });
    }
    /**
     * Convert inquiry to lead
     */
    convertToLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validationResult = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!validationResult.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: validationResult.error.format(),
                    });
                    return;
                }
                const { id } = validationResult.data;
                const result = yield inquiryService.convertToLead(id, req.user.id);
                res.json({
                    message: "Inquiry successfully converted to lead",
                    data: result,
                });
            }
            catch (error) {
                console.error("Error converting inquiry to lead:", error);
                if (error instanceof Error && error.message === "Inquiry not found") {
                    res.status(404).json({ error: "Inquiry not found" });
                }
                else {
                    res.status(500).json({ error: "Failed to convert inquiry to lead" });
                }
            }
        });
    }
    /**
     * Update inquiry priority
     */
    updatePriority(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const priorityValidation = zod_1.z
                    .object({
                    priority: zod_1.z.enum(["Low", "Medium", "High", "Urgent"]),
                })
                    .safeParse(req.body);
                if (!priorityValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid priority",
                        details: priorityValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const { priority } = priorityValidation.data;
                const updatedInquiry = yield inquiryService.updatePriority(id, priority, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error updating inquiry priority:", error);
                res.status(500).json({ error: "Failed to update inquiry priority" });
            }
        });
    }
    /**
     * Update inquiry due date
     */
    updateDueDate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const dueDateValidation = zod_1.z
                    .object({
                    dueDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
                        message: "Invalid date format",
                    }),
                })
                    .safeParse(req.body);
                if (!dueDateValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid due date",
                        details: dueDateValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const { dueDate } = dueDateValidation.data;
                const updatedInquiry = yield inquiryService.updateDueDate(id, new Date(dueDate), req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error updating inquiry due date:", error);
                res.status(500).json({ error: "Failed to update inquiry due date" });
            }
        });
    }
    /**
     * Assign inquiry to user
     */
    assignInquiry(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idValidation = inquiry_schema_1.inquiryIdSchema.safeParse(req.params);
                if (!idValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid inquiry ID",
                        details: idValidation.error.format(),
                    });
                    return;
                }
                const { id } = idValidation.data;
                const assignValidation = zod_1.z
                    .object({
                    assignedToId: zod_1.z.string().uuid(),
                })
                    .safeParse(req.body);
                if (!assignValidation.success) {
                    res
                        .status(400)
                        .json({
                        error: "Invalid user ID",
                        details: assignValidation.error.format(),
                    });
                    return;
                }
                const existingInquiry = yield inquiryService.findById(id);
                if (!existingInquiry) {
                    res.status(404).json({ error: "Inquiry not found" });
                    return;
                }
                const { assignedToId } = assignValidation.data;
                const updatedInquiry = yield inquiryService.assignInquiry(id, assignedToId, req.user.id);
                res.json(updatedInquiry);
            }
            catch (error) {
                console.error("Error assigning inquiry:", error);
                res.status(500).json({ error: "Failed to assign inquiry" });
            }
        });
    }
    /**
     * Get inquiry statistics by type
     */
    getInquiryStatisticsByType(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { startDate, endDate } = req.query;
                const statistics = yield inquiryService.getStatistics(startDate, endDate);
                res.json(statistics);
            }
            catch (error) {
                console.error("Error fetching inquiry type statistics:", error);
                res
                    .status(500)
                    .json({ error: "Failed to fetch inquiry type statistics" });
            }
        });
    }
}
exports.InquiryController = InquiryController;
