import { prisma } from "../../config/prisma";
import {
  InquiryFilterParams,
  PaginatedResponse,
  CreateInquiryDto,
  UpdateInquiryDto,
  InquiryStatistics,
  ConversionResult,
  QuoteDetails,
  InquiryContactResponse,
  ProductType,
  InquiryTypeEnum,
  MonthlyDataRaw
} from "./inquiry.types";
import {
  DeliveryMethod,
  InquiryStatus,
  LeadStatus,
  ReferenceSource,
  Priority,
  Inquiry
} from "@prisma/client";

export class InquiryService {
  /**
   * Get all inquiries with pagination and filtering
   */
  async findAll(
    params: InquiryFilterParams
  ): Promise<PaginatedResponse<Inquiry>> {
    const {
      page = 1,
      limit = 10,
      status,
      source,
      productType,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = params;
    const skip = (page - 1) * limit;

    // Build filter object
    const where: any = {};

    // Only add status to where clause if it's not "all"
    if (status && status !== "all") {
      where.status = status;
    }

    if (source) where.referenceSource = source;
    if (productType) where.productType = productType;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Create sort object
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const inquiries = await prisma.inquiry.findMany({
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

    const total = await prisma.inquiry.count({ where });

    return {
      data: inquiries as Inquiry[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Inquiry | null> {
    const inquiry = await prisma.inquiry.findUnique({
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

    return inquiry as Inquiry | null;
  }

  async checkCustomerExists(params: {
    email?: string;
    phoneNumber?: string;
    companyName?: string;
  }): Promise<InquiryContactResponse> {
    const { email, phoneNumber, companyName } = params;

    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phone: phoneNumber });

    let existingCompany = null;
    if (companyName) {
      existingCompany = await prisma.company.findUnique({
        where: { name: companyName },
      });
    }

    let existingLead = null;
    if (whereConditions.length > 0 || existingCompany) {
      const leadQuery: any = { OR: [] };

      if (whereConditions.length > 0) {
        leadQuery.OR = whereConditions;
      }

      if (existingCompany) {
        leadQuery.OR.push({ companyId: existingCompany.id });
      }

      existingLead = await prisma.lead.findFirst({
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
  }

  async create(data: CreateInquiryDto, userId: string): Promise<Inquiry> {
    const customerCheck = await this.checkCustomerExists({
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.isCompany ? data.companyName : undefined,
    });

    const inquiryData: any = {
      ...data,
      inquiryType: data.inquiryType as InquiryTypeEnum,
      productType: data.productType as ProductType,
      preferredDate: new Date(data.preferredDate),
      deliveryMethod: data.deliveryMethod as DeliveryMethod,
      referenceSource: data.referenceSource as ReferenceSource,
      deliveryLocation: data.deliveryLocation ?? "",
      status: InquiryStatus.New,
    };

    if (customerCheck.lead) {
      inquiryData.relatedLeadId = customerCheck.lead.id;
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      const newInquiry = await tx.inquiry.create({
        data: {
          ...inquiryData,
          createdBy: { connect: { id: userId } },
          status: InquiryStatus.New,
        },
        include: { createdBy: true },
      });

      if (customerCheck.lead) {
        const oldStatus = customerCheck.lead.status;
        const newStatus = this.determineLeadStatusFromInquiry("New", oldStatus);

        if (oldStatus !== newStatus) {
          await tx.lead.update({
            where: { id: customerCheck.lead.id },
            data: {
              status: newStatus,
              lastContactDate: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.activityLog.create({
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

        await tx.contactHistory.create({
          data: {
            leadId: customerCheck.lead.id,
            method: "Inquiry Form",
            summary: `New inquiry for ${data.productType}, quantity: ${data.quantity}`,
            outcome: "New inquiry created",
          },
        });
      }

      return newInquiry;
    });

    return inquiry as Inquiry;
  }

  async update(
    id: string,
    data: UpdateInquiryDto,
    userId: string
  ): Promise<Inquiry> {
    // Get the current inquiry to check for status changes
    const currentInquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true, createdBy: true },
    });

    if (!currentInquiry) {
      throw new Error("Inquiry not found");
    }

    const updateData: any = {
      ...data,
      preferredDate: data.preferredDate
        ? new Date(data.preferredDate)
        : undefined,
    };

    return prisma.$transaction(async (tx) => {
      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: updateData,
        include: {
          relatedLead: true,
          createdBy: true,
        },
      });

      if (
        data.status &&
        data.status !== currentInquiry.status &&
        currentInquiry.relatedLead
      ) {
        const oldLeadStatus = currentInquiry.relatedLead.status;
        const newLeadStatus = this.determineLeadStatusFromInquiry(
          data.status,
          oldLeadStatus
        );

        if (oldLeadStatus !== newLeadStatus) {
          await tx.lead.update({
            where: { id: currentInquiry.relatedLead.id },
            data: {
              status: newLeadStatus,
              lastContactDate: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.activityLog.create({
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

          await tx.contactHistory.create({
            data: {
              leadId: currentInquiry.relatedLead.id,
              method: "System Update",
              summary: `Inquiry status changed to ${data.status}`,
              outcome: `Lead status updated to ${newLeadStatus}`,
            },
          });
        }
      }

      return updatedInquiry as Inquiry;
    });
  }

  async createQuote(
    id: string,
    quoteDetails: QuoteDetails,
    userId: string
  ): Promise<Inquiry> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true },
    });

    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    return prisma.$transaction(async (tx) => {
      const updatedInquiry = await tx.inquiry.update({
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
        const newStatus = "Proposal" as LeadStatus;

        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            status: newStatus,
            estimatedValue: quoteDetails.totalPrice,
            lastContactDate: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            createdById: userId,
            action: "QUOTE_CREATED",
            description: `Quote created for ${inquiry.productType}, amount: ${quoteDetails.totalPrice}`,
            oldStatus,
            newStatus,
            metadata: { inquiryId: id, ...quoteDetails },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "Quote",
            summary: `Quote of ${quoteDetails.totalPrice} sent for ${inquiry.productType}`,
            outcome: "Awaiting customer response",
          },
        });
      }

      return updatedInquiry as Inquiry;
    });
  }

  async approveInquiry(id: string, userId: string): Promise<Inquiry> {
    return this.updateInquiryStatus(
      id,
      "Approved",
      "Negotiation",
      "Quote accepted by customer",
      userId
    );
  }

  async scheduleInquiry(
    id: string,
    scheduledDate: Date,
    userId: string
  ): Promise<Inquiry> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { relatedLead: true, createdBy: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const updatedInquiry = await tx.inquiry.update({
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

        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            lastContactDate: new Date(),
            updatedAt: new Date(),
            followUpDate: scheduledDate,
          },
        });

        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            createdById: userId,
            action: "DELIVERY_SCHEDULED",
            description: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }`,
            oldStatus,
            newStatus: oldStatus,
            metadata: { inquiryId: id, scheduledDate },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "System Update",
            summary: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }`,
            outcome: "Awaiting delivery",
          },
        });
      }

      return updatedInquiry as Inquiry;
    });
  }

  async fulfillInquiry(id: string, userId: string): Promise<Inquiry> {
    return this.updateInquiryStatus(
      id,
      "Fulfilled",
      "Converted",
      "Order successfully fulfilled",
      userId
    );
  }

  private async updateInquiryStatus(
    id: string,
    inquiryStatus: InquiryStatus,
    leadStatus: LeadStatus,
    outcome: string,
    userId: string
  ): Promise<Inquiry> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { relatedLead: true, createdBy: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: { status: inquiryStatus },
        include: {
          relatedLead: true,
          createdBy: true,
        },
      });

      if (inquiry.relatedLead) {
        const oldStatus = inquiry.relatedLead.status;

        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            status: leadStatus,
            lastContactDate: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.activityLog.create({
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

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "System Update",
            summary: `Inquiry status changed to ${inquiryStatus}`,
            outcome,
          },
        });
      }

      return updatedInquiry as Inquiry;
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.inquiry.delete({
      where: { id },
    });
  }

  async getStatistics(
    startDate?: string | Date,
    endDate?: string | Date
  ): Promise<InquiryStatistics> {
    // Set date range
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
  
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }
  
    // Fetch counts (Prisma returns BigInt here)
    const totalInquiriesBigInt = await prisma.inquiry.count({ where });
  
    const statusCountsBigInt = await prisma.inquiry.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      where,
    });
  
    const sourceCountsBigInt = await prisma.inquiry.groupBy({
      by: ["referenceSource"],
      _count: {
        referenceSource: true,
      },
      where,
    });
  
    const productTypeCountsBigInt = await prisma.inquiry.groupBy({
      by: ["productType"],
      _count: {
        productType: true,
      },
      where,
    });
  
    const convertedCountBigInt = await prisma.inquiry.count({
      where: {
        ...where,
        status: {
          in: [
            InquiryStatus.Approved,
            InquiryStatus.Scheduled,
            InquiryStatus.Fulfilled,
          ],
        },
      },
    });
  
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
  
    // Fetch raw data (count is BigInt)
    const monthlyDataBigInt = await prisma.$queryRaw<MonthlyDataRaw[]>`
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
      byStatus,      // Counts converted in .map()
      bySource,      // Counts converted in .map()
      byProductType, // Counts converted in .map()
      monthlyTrends, // Counts converted in .map()
      conversionRate:
        totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0, // Use converted numbers
    };
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(id: string, userId: string): Promise<ConversionResult> {
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
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
        company = await tx.company.upsert({
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
      } else {
        // Create a new company based on customer name
        company = await tx.company.create({
          data: {
            name: `${inquiry.customerName}'s Company`, // Fallback company name
            email: inquiry.email,
            phone: inquiry.phoneNumber,
          },
        });
      }

      // Determine appropriate lead status based on inquiry status
      let leadStatus: LeadStatus = "New";

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
      const lead = await tx.lead.create({
        data: {
          companyId: company.id,
          contactPerson: inquiry.customerName ?? "Unknown",

          email: inquiry.email ?? "unknown@example.com",
          phone: inquiry.phoneNumber,
          status: leadStatus,
          source: "Inquiry",
          subSource: inquiry.referenceSource,
          estimatedValue: inquiry.quotedPrice || null,
          createdById: userId,
          assignedToId: userId,
          notes: `Converted from inquiry. Original remarks: ${
            inquiry.remarks || "None"
          }`,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Create contact history entry
      await tx.contactHistory.create({
        data: {
          leadId: lead.id,
          method: "Inquiry Form",
          summary: "Initial inquiry submitted through inquiry form",
          outcome: "Converted to lead",
        },
      });

      // Update inquiry to link it to the lead
      await tx.inquiry.update({
        where: { id },
        data: {
          status: InquiryStatus.Approved,
          relatedLeadId: lead.id,
        },
      });

      return { lead, company };
    });

    return result;
  }

  async cancelInquiry(
    inquiryId: string,
    cancelledById: string
  ): Promise<Inquiry> {
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      // Update the inquiry status to Cancelled
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.Cancelled,
          updatedAt: new Date(),
        },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      return updatedInquiry as Inquiry;
    } catch (error) {
      console.error("Error cancelling inquiry:", error);
      throw error;
    }
  }

  /**
   * Updates the priority of an inquiry
   * @param inquiryId - The ID of the inquiry to update
   * @param priority - The new priority level
   * @param updatedById - The ID of the user updating the priority
   * @returns The updated inquiry
   */
  async updatePriority(
    inquiryId: string,
    priority: Priority,
    updatedById: string
  ): Promise<Inquiry> {
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      // Update the inquiry priority
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          priority,
          updatedAt: new Date(),
        },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      return updatedInquiry as Inquiry;
    } catch (error) {
      console.error("Error updating inquiry priority:", error);
      throw error;
    }
  }

  /**
   * Updates the due date of an inquiry
   * @param inquiryId - The ID of the inquiry to update
   * @param dueDate - The new due date
   * @param updatedById - The ID of the user updating the due date
   * @returns The updated inquiry
   */
  async updateDueDate(
    inquiryId: string,
    dueDate: Date,
    updatedById: string
  ): Promise<Inquiry> {
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      // Update the inquiry due date
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          dueDate,
          updatedAt: new Date(),
        },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      return updatedInquiry as Inquiry;
    } catch (error) {
      console.error("Error updating inquiry due date:", error);
      throw error;
    }
  }

  /**
   * Assigns an inquiry to a user
   * @param inquiryId - The ID of the inquiry to assign
   * @param assignedToId - The ID of the user to assign the inquiry to
   * @param assignedById - The ID of the user making the assignment
   * @returns The updated inquiry
   */
  async assignInquiry(
    inquiryId: string,
    assignedToId: string,
    assignedById: string
  ): Promise<Inquiry> {
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      // Check if the user being assigned exists
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignedUser) {
        throw new Error(`User with ID ${assignedToId} not found`);
      }

      // Assign the inquiry to the user
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          assignedToId,
          updatedAt: new Date(),
        },
        include: { createdBy: true, assignedTo: true, relatedLead: true },
      });

      return updatedInquiry as Inquiry;
    } catch (error) {
      console.error("Error assigning inquiry:", error);
      throw error;
    }
  }

  /**
   * Determine the appropriate lead status based on inquiry status
   */
  private determineLeadStatusFromInquiry(
    inquiryStatus: string,
    currentLeadStatus: LeadStatus
  ): LeadStatus {
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
