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
exports.InquiryService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
class InquiryService {
    /**
     * Get all inquiries with pagination and filtering
     */
    findAll(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, status, source, productType, sortBy = "createdAt", sortOrder = "desc", search, } = params;
            const skip = (page - 1) * limit;
            // Build filter object
            const where = {};
            // Only add status to where clause if it's not "all"
            if (status && status !== "all") {
                where.status = status;
            }
            if (source)
                where.referenceSource = source;
            if (productType)
                where.productType = productType;
            if (search) {
                where.OR = [
                    { customerName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phoneNumber: { contains: search, mode: "insensitive" } },
                    { companyName: { contains: search, mode: "insensitive" } },
                ];
            }
            // Create sort object
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            const inquiries = yield prisma_1.prisma.inquiry.findMany({
                skip,
                take: limit,
                where,
                orderBy,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    relatedLead: true,
                },
            });
            const total = yield prisma_1.prisma.inquiry.count({ where });
            return {
                data: inquiries,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const inquiry = yield prisma_1.prisma.inquiry.findUnique({
                where: { id },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    relatedLead: {
                        include: {
                            company: true,
                            contactHistory: {
                                orderBy: {
                                    timestamp: "desc",
                                },
                            },
                        },
                    },
                },
            });
            return inquiry;
        });
    }
    checkCustomerExists(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, phoneNumber, companyName } = params;
            const whereConditions = [];
            if (email)
                whereConditions.push({ email });
            if (phoneNumber)
                whereConditions.push({ phone: phoneNumber });
            let existingCompany = null;
            if (companyName) {
                existingCompany = yield prisma_1.prisma.company.findUnique({
                    where: { name: companyName },
                });
            }
            let existingLead = null;
            if (whereConditions.length > 0 || existingCompany) {
                const leadQuery = { OR: [] };
                if (whereConditions.length > 0) {
                    leadQuery.OR = whereConditions;
                }
                if (existingCompany) {
                    leadQuery.OR.push({ companyId: existingCompany.id });
                }
                existingLead = yield prisma_1.prisma.lead.findFirst({
                    where: leadQuery,
                    include: {
                        company: true,
                        contactHistory: {
                            orderBy: {
                                timestamp: "desc",
                            },
                            take: 5,
                        },
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                });
            }
            return {
                exists: !!(existingCompany || existingLead),
                lead: existingLead,
                company: existingCompany,
            };
        });
    }
    create(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const customerCheck = yield this.checkCustomerExists({
                email: data.email,
                phoneNumber: data.phoneNumber,
                companyName: data.isCompany ? data.companyName : undefined,
            });
            const inquiryData = Object.assign(Object.assign({}, data), { inquiryType: data.inquiryType, productType: data.productType, preferredDate: new Date(data.preferredDate), deliveryMethod: data.deliveryMethod, referenceSource: data.referenceSource, deliveryLocation: (_a = data.deliveryLocation) !== null && _a !== void 0 ? _a : "", status: client_1.InquiryStatus.New });
            if (customerCheck.lead) {
                inquiryData.relatedLeadId = customerCheck.lead.id;
            }
            const inquiry = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const newInquiry = yield tx.inquiry.create({
                    data: Object.assign(Object.assign({}, inquiryData), { createdBy: { connect: { id: userId } }, status: client_1.InquiryStatus.New }),
                    include: { createdBy: true },
                });
                if (customerCheck.lead) {
                    const oldStatus = customerCheck.lead.status;
                    const newStatus = this.determineLeadStatusFromInquiry("New", oldStatus);
                    if (oldStatus !== newStatus) {
                        yield tx.lead.update({
                            where: { id: customerCheck.lead.id },
                            data: {
                                status: newStatus,
                                lastContactDate: new Date(),
                                updatedAt: new Date(),
                            },
                        });
                        yield tx.activityLog.create({
                            data: {
                                leadId: customerCheck.lead.id,
                                userId,
                                createdById: userId,
                                action: "STATUS_CHANGE",
                                description: `Lead status updated due to new inquiry`,
                                oldStatus,
                                newStatus,
                                metadata: { inquiryId: newInquiry.id },
                            },
                        });
                    }
                    yield tx.contactHistory.create({
                        data: {
                            leadId: customerCheck.lead.id,
                            method: "Inquiry Form",
                            summary: `New inquiry for ${data.productType}, quantity: ${data.quantity}`,
                            outcome: "New inquiry created",
                        },
                    });
                }
                return newInquiry;
            }));
            return inquiry;
        });
    }
    update(id, data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the current inquiry to check for status changes
            const currentInquiry = yield prisma_1.prisma.inquiry.findUnique({
                where: { id },
                include: { relatedLead: true, createdBy: true },
            });
            if (!currentInquiry) {
                throw new Error("Inquiry not found");
            }
            const updateData = Object.assign(Object.assign({}, data), { preferredDate: data.preferredDate
                    ? new Date(data.preferredDate)
                    : undefined });
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const updatedInquiry = yield tx.inquiry.update({
                    where: { id },
                    data: updateData,
                    include: {
                        relatedLead: true,
                        createdBy: true,
                    },
                });
                if (data.status &&
                    data.status !== currentInquiry.status &&
                    currentInquiry.relatedLead) {
                    const oldLeadStatus = currentInquiry.relatedLead.status;
                    const newLeadStatus = this.determineLeadStatusFromInquiry(data.status, oldLeadStatus);
                    if (oldLeadStatus !== newLeadStatus) {
                        yield tx.lead.update({
                            where: { id: currentInquiry.relatedLead.id },
                            data: {
                                status: newLeadStatus,
                                lastContactDate: new Date(),
                                updatedAt: new Date(),
                            },
                        });
                        yield tx.activityLog.create({
                            data: {
                                leadId: currentInquiry.relatedLead.id,
                                userId,
                                createdById: userId,
                                action: "STATUS_CHANGE",
                                description: `Lead status updated due to inquiry status change to ${data.status}`,
                                oldStatus: oldLeadStatus,
                                newStatus: newLeadStatus,
                                metadata: { inquiryId: id },
                            },
                        });
                        yield tx.contactHistory.create({
                            data: {
                                leadId: currentInquiry.relatedLead.id,
                                method: "System Update",
                                summary: `Inquiry status changed to ${data.status}`,
                                outcome: `Lead status updated to ${newLeadStatus}`,
                            },
                        });
                    }
                }
                return updatedInquiry;
            }));
        });
    }
    createQuote(id, quoteDetails, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const inquiry = yield prisma_1.prisma.inquiry.findUnique({
                where: { id },
                include: { relatedLead: true },
            });
            if (!inquiry) {
                throw new Error("Inquiry not found");
            }
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const updatedInquiry = yield tx.inquiry.update({
                    where: { id },
                    data: {
                        status: "Quoted",
                        quotedPrice: quoteDetails.totalPrice,
                        quotedBy: userId,
                        quotedAt: new Date(),
                    },
                    include: {
                        relatedLead: true,
                        createdBy: true,
                    },
                });
                if (inquiry.relatedLead) {
                    const oldStatus = inquiry.relatedLead.status;
                    const newStatus = "Proposal";
                    yield tx.lead.update({
                        where: { id: inquiry.relatedLead.id },
                        data: {
                            status: newStatus,
                            estimatedValue: quoteDetails.totalPrice,
                            lastContactDate: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                    yield tx.activityLog.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            userId,
                            createdById: userId,
                            action: "QUOTE_CREATED",
                            description: `Quote created for ${inquiry.productType}, amount: ${quoteDetails.totalPrice}`,
                            oldStatus,
                            newStatus,
                            metadata: Object.assign({ inquiryId: id }, quoteDetails),
                        },
                    });
                    yield tx.contactHistory.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            method: "Quote",
                            summary: `Quote of ${quoteDetails.totalPrice} sent for ${inquiry.productType}`,
                            outcome: "Awaiting customer response",
                        },
                    });
                }
                return updatedInquiry;
            }));
        });
    }
    approveInquiry(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateInquiryStatus(id, "Approved", "Negotiation", "Quote accepted by customer", userId);
        });
    }
    scheduleInquiry(id, scheduledDate, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const inquiry = yield tx.inquiry.findUnique({
                    where: { id },
                    include: { relatedLead: true, createdBy: true },
                });
                if (!inquiry) {
                    throw new Error("Inquiry not found");
                }
                const updatedInquiry = yield tx.inquiry.update({
                    where: { id },
                    data: {
                        status: "Scheduled",
                        preferredDate: scheduledDate,
                    },
                    include: {
                        relatedLead: true,
                        createdBy: true,
                    },
                });
                if (inquiry.relatedLead) {
                    const oldStatus = inquiry.relatedLead.status;
                    yield tx.lead.update({
                        where: { id: inquiry.relatedLead.id },
                        data: {
                            lastContactDate: new Date(),
                            updatedAt: new Date(),
                            followUpDate: scheduledDate,
                        },
                    });
                    yield tx.activityLog.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            userId,
                            createdById: userId,
                            action: "DELIVERY_SCHEDULED",
                            description: `Delivery scheduled for ${scheduledDate.toISOString().split("T")[0]}`,
                            oldStatus,
                            newStatus: oldStatus,
                            metadata: { inquiryId: id, scheduledDate },
                        },
                    });
                    yield tx.contactHistory.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            method: "System Update",
                            summary: `Delivery scheduled for ${scheduledDate.toISOString().split("T")[0]}`,
                            outcome: "Awaiting delivery",
                        },
                    });
                }
                return updatedInquiry;
            }));
        });
    }
    fulfillInquiry(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateInquiryStatus(id, "Fulfilled", "Converted", "Order successfully fulfilled", userId);
        });
    }
    updateInquiryStatus(id, inquiryStatus, leadStatus, outcome, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const inquiry = yield tx.inquiry.findUnique({
                    where: { id },
                    include: { relatedLead: true, createdBy: true },
                });
                if (!inquiry) {
                    throw new Error("Inquiry not found");
                }
                const updatedInquiry = yield tx.inquiry.update({
                    where: { id },
                    data: { status: inquiryStatus },
                    include: {
                        relatedLead: true,
                        createdBy: true,
                    },
                });
                if (inquiry.relatedLead) {
                    const oldStatus = inquiry.relatedLead.status;
                    yield tx.lead.update({
                        where: { id: inquiry.relatedLead.id },
                        data: {
                            status: leadStatus,
                            lastContactDate: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                    yield tx.activityLog.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            userId,
                            createdById: userId,
                            action: "STATUS_CHANGE",
                            description: `Lead status updated due to inquiry status change to ${inquiryStatus}`,
                            oldStatus,
                            newStatus: leadStatus,
                            metadata: { inquiryId: id },
                        },
                    });
                    yield tx.contactHistory.create({
                        data: {
                            leadId: inquiry.relatedLead.id,
                            method: "System Update",
                            summary: `Inquiry status changed to ${inquiryStatus}`,
                            outcome,
                        },
                    });
                }
                return updatedInquiry;
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.prisma.inquiry.delete({
                where: { id },
            });
        });
    }
    getStatistics(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set date range
            const dateFilter = {};
            if (startDate) {
                dateFilter.gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.lte = new Date(endDate);
            }
            const where = {};
            if (startDate || endDate) {
                where.createdAt = dateFilter;
            }
            // Fetch counts (Prisma returns BigInt here)
            const totalInquiriesBigInt = yield prisma_1.prisma.inquiry.count({ where });
            const statusCountsBigInt = yield prisma_1.prisma.inquiry.groupBy({
                by: ["status"],
                _count: {
                    status: true,
                },
                where,
            });
            const sourceCountsBigInt = yield prisma_1.prisma.inquiry.groupBy({
                by: ["referenceSource"],
                _count: {
                    referenceSource: true,
                },
                where,
            });
            const productTypeCountsBigInt = yield prisma_1.prisma.inquiry.groupBy({
                by: ["productType"],
                _count: {
                    productType: true,
                },
                where,
            });
            const convertedCountBigInt = yield prisma_1.prisma.inquiry.count({
                where: Object.assign(Object.assign({}, where), { status: {
                        in: [
                            client_1.InquiryStatus.Approved,
                            client_1.InquiryStatus.Scheduled,
                            client_1.InquiryStatus.Fulfilled,
                        ],
                    } }),
            });
            const currentDate = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
            // Fetch raw data (count is BigInt)
            const monthlyDataBigInt = yield prisma_1.prisma.$queryRaw `
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM "Inquiry"
        WHERE "createdAt" >= ${sixMonthsAgo} AND "createdAt" <= ${currentDate} -- Consider adding end date for consistency
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `;
            // --- CONVERSION STEP ---
            // Convert BigInt results to Number (or String) before returning
            const totalInquiries = Number(totalInquiriesBigInt);
            const convertedCount = Number(convertedCountBigInt);
            const byStatus = statusCountsBigInt.map((item) => ({
                status: item.status,
                count: Number(item._count.status), // Convert count
            }));
            const bySource = sourceCountsBigInt.map((item) => ({
                source: item.referenceSource,
                count: Number(item._count.referenceSource), // Convert count
            }));
            const byProductType = productTypeCountsBigInt.map((item) => ({
                productType: item.productType,
                count: Number(item._count.productType), // Convert count
            }));
            const monthlyTrends = monthlyDataBigInt.map((item) => ({
                month: item.month,
                count: Number(item.count) // Convert count
            }));
            return {
                totalInquiries, // Already converted
                byStatus, // Counts converted in .map()
                bySource, // Counts converted in .map()
                byProductType, // Counts converted in .map()
                monthlyTrends, // Counts converted in .map()
                conversionRate: totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0, // Use converted numbers
            };
        });
    }
    /**
     * Convert inquiry to lead
     */
    convertToLead(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const inquiry = yield tx.inquiry.findUnique({
                    where: { id },
                });
                if (!inquiry) {
                    throw new Error("Inquiry not found");
                }
                // Check if lead already exists
                if (inquiry.relatedLeadId) {
                    throw new Error("This inquiry is already linked to a lead");
                }
                let company;
                if (inquiry.isCompany && inquiry.companyName) {
                    company = yield tx.company.upsert({
                        where: {
                            name: inquiry.companyName,
                        },
                        update: {},
                        create: {
                            name: inquiry.companyName,
                            email: inquiry.email,
                            phone: inquiry.phoneNumber,
                            industry: null,
                            region: null,
                        },
                    });
                }
                else {
                    // Create a new company based on customer name
                    company = yield tx.company.create({
                        data: {
                            name: `${inquiry.customerName}'s Company`, // Fallback company name
                            email: inquiry.email,
                            phone: inquiry.phoneNumber,
                        },
                    });
                }
                // Determine appropriate lead status based on inquiry status
                let leadStatus = "New";
                switch (inquiry.status) {
                    case "New":
                        leadStatus = "New";
                        break;
                    case "Quoted":
                        leadStatus = "Proposal";
                        break;
                    case "Approved":
                        leadStatus = "Negotiation";
                        break;
                    case "Scheduled":
                        leadStatus = "Qualified";
                        break;
                    case "Fulfilled":
                        leadStatus = "Converted";
                        break;
                    default:
                        leadStatus = "New";
                }
                // Create lead
                const lead = yield tx.lead.create({
                    data: {
                        companyId: company.id,
                        contactPerson: (_a = inquiry.customerName) !== null && _a !== void 0 ? _a : "Unknown",
                        email: (_b = inquiry.email) !== null && _b !== void 0 ? _b : "unknown@example.com",
                        phone: inquiry.phoneNumber,
                        status: leadStatus,
                        source: "Inquiry",
                        subSource: inquiry.referenceSource,
                        estimatedValue: inquiry.quotedPrice || null,
                        createdById: userId,
                        assignedToId: userId,
                        notes: `Converted from inquiry. Original remarks: ${inquiry.remarks || "None"}`,
                        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
                // Create contact history entry
                yield tx.contactHistory.create({
                    data: {
                        leadId: lead.id,
                        method: "Inquiry Form",
                        summary: "Initial inquiry submitted through inquiry form",
                        outcome: "Converted to lead",
                    },
                });
                // Update inquiry to link it to the lead
                yield tx.inquiry.update({
                    where: { id },
                    data: {
                        status: client_1.InquiryStatus.Approved,
                        relatedLeadId: lead.id,
                    },
                });
                return { lead, company };
            }));
            return result;
        });
    }
    cancelInquiry(inquiryId, cancelledById) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if inquiry exists
                const existingInquiry = yield prisma_1.prisma.inquiry.findUnique({
                    where: { id: inquiryId },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                if (!existingInquiry) {
                    throw new Error(`Inquiry with ID ${inquiryId} not found`);
                }
                // Update the inquiry status to Cancelled
                const updatedInquiry = yield prisma_1.prisma.inquiry.update({
                    where: { id: inquiryId },
                    data: {
                        status: client_1.InquiryStatus.Cancelled,
                        updatedAt: new Date(),
                    },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                return updatedInquiry;
            }
            catch (error) {
                console.error("Error cancelling inquiry:", error);
                throw error;
            }
        });
    }
    /**
     * Updates the priority of an inquiry
     * @param inquiryId - The ID of the inquiry to update
     * @param priority - The new priority level
     * @param updatedById - The ID of the user updating the priority
     * @returns The updated inquiry
     */
    updatePriority(inquiryId, priority, updatedById) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if inquiry exists
                const existingInquiry = yield prisma_1.prisma.inquiry.findUnique({
                    where: { id: inquiryId },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                if (!existingInquiry) {
                    throw new Error(`Inquiry with ID ${inquiryId} not found`);
                }
                // Update the inquiry priority
                const updatedInquiry = yield prisma_1.prisma.inquiry.update({
                    where: { id: inquiryId },
                    data: {
                        priority,
                        updatedAt: new Date(),
                    },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                return updatedInquiry;
            }
            catch (error) {
                console.error("Error updating inquiry priority:", error);
                throw error;
            }
        });
    }
    /**
     * Updates the due date of an inquiry
     * @param inquiryId - The ID of the inquiry to update
     * @param dueDate - The new due date
     * @param updatedById - The ID of the user updating the due date
     * @returns The updated inquiry
     */
    updateDueDate(inquiryId, dueDate, updatedById) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if inquiry exists
                const existingInquiry = yield prisma_1.prisma.inquiry.findUnique({
                    where: { id: inquiryId },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                if (!existingInquiry) {
                    throw new Error(`Inquiry with ID ${inquiryId} not found`);
                }
                // Update the inquiry due date
                const updatedInquiry = yield prisma_1.prisma.inquiry.update({
                    where: { id: inquiryId },
                    data: {
                        dueDate,
                        updatedAt: new Date(),
                    },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                return updatedInquiry;
            }
            catch (error) {
                console.error("Error updating inquiry due date:", error);
                throw error;
            }
        });
    }
    /**
     * Assigns an inquiry to a user
     * @param inquiryId - The ID of the inquiry to assign
     * @param assignedToId - The ID of the user to assign the inquiry to
     * @param assignedById - The ID of the user making the assignment
     * @returns The updated inquiry
     */
    assignInquiry(inquiryId, assignedToId, assignedById) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if inquiry exists
                const existingInquiry = yield prisma_1.prisma.inquiry.findUnique({
                    where: { id: inquiryId },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                if (!existingInquiry) {
                    throw new Error(`Inquiry with ID ${inquiryId} not found`);
                }
                // Check if the user being assigned exists
                const assignedUser = yield prisma_1.prisma.user.findUnique({
                    where: { id: assignedToId },
                });
                if (!assignedUser) {
                    throw new Error(`User with ID ${assignedToId} not found`);
                }
                // Assign the inquiry to the user
                const updatedInquiry = yield prisma_1.prisma.inquiry.update({
                    where: { id: inquiryId },
                    data: {
                        assignedToId,
                        updatedAt: new Date(),
                    },
                    include: { createdBy: true, assignedTo: true, relatedLead: true },
                });
                return updatedInquiry;
            }
            catch (error) {
                console.error("Error assigning inquiry:", error);
                throw error;
            }
        });
    }
    /**
     * Determine the appropriate lead status based on inquiry status
     */
    determineLeadStatusFromInquiry(inquiryStatus, currentLeadStatus) {
        // Logic to determine lead status based on inquiry status
        switch (inquiryStatus) {
            case "New":
                // For new inquiries, don't downgrade lead status
                return currentLeadStatus;
            case "Quoted":
                // Move to proposal stage when quoted, but don't downgrade
                return currentLeadStatus === "New" || currentLeadStatus === "Contacted"
                    ? "Proposal"
                    : currentLeadStatus;
            case "Approved":
                // Move to negotiation when approved
                return "Negotiation";
            case "Scheduled":
                // When scheduled, keep as negotiation
                return currentLeadStatus === "Negotiation"
                    ? currentLeadStatus
                    : "Negotiation";
            case "Fulfilled":
                // When fulfilled, move to converted
                return "Converted";
            default:
                return currentLeadStatus;
        }
    }
}
exports.InquiryService = InquiryService;
