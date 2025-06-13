import { prisma } from "../../config/prisma";
import {
  InquiryFilterParams,
  PaginatedResponse,
  InquiryStatistics,
  ConversionResult,
  QuoteDetails,
  InquiryContactResponse,
  InquiryTypeEnum,
  MonthlyDataRaw,
  CreateInquiryDto,
  UpdateInquiryDto,
} from "./inquiry.types";
import {
  DeliveryMethod,
  InquiryStatus,
  LeadStatus,
  ReferenceSource,
  Priority,
  Inquiry,
  Product,
} from "@prisma/client";

export class InquiryService {
  /**
   * Get all inquiries with pagination and filtering
   */
  async findAll(
    params: InquiryFilterParams
  ): Promise<PaginatedResponse<Inquiry & { product: Product | null }>> {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      productId,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (source) where.referenceSource = source;
    if (productId) where.productId = productId;
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === "product.name") {
      orderBy.product = { name: sortOrder };
    } else if (sortBy === "assignedTo.name") {
      orderBy.assignedTo = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder; 
    }

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
        product: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        }
      },
    });

    const total = await prisma.inquiry.count({ where });

    return {
      data: inquiries as (Inquiry & { product: Product | null })[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    id: string
  ): Promise<(Inquiry & { product: Product | null }) | null> {
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
        product: true,
      },
    });

    return inquiry as (Inquiry & { product: Product | null }) | null;
  }

  async checkClientExists(params: {
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

  async create(
    data: CreateInquiryDto,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    const clientCheck = await this.checkClientExists({
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.isCompany ? data.companyName : undefined,
    });

    const inquiryData: any = {
      ...data,
      inquiryType: data.inquiryType as InquiryTypeEnum,
      productId: data.productId,
      preferredDate: new Date(data.preferredDate),
      deliveryMethod: data.deliveryMethod as DeliveryMethod,
      referenceSource: data.referenceSource as ReferenceSource,
      deliveryLocation: data.deliveryLocation ?? "",
      status: InquiryStatus.New,
    };

    if (clientCheck.lead) {
      inquiryData.relatedLeadId = clientCheck.lead.id;
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      const newInquiry = await tx.inquiry.create({
        data: {
          ...inquiryData,
          createdBy: { connect: { id: userId } },
          status: InquiryStatus.New,
        },
        include: {
          createdBy: true,
          product: true,
        },
      });

      if (clientCheck.lead) {
        const oldStatus = clientCheck.lead.status;
        const newStatus = this.determineLeadStatusFromInquiry("New", oldStatus);

        if (oldStatus !== newStatus) {
          await tx.lead.update({
            where: { id: clientCheck.lead.id },
            data: {
              status: newStatus,
              lastContactDate: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.activityLog.create({
            data: {
              leadId: clientCheck.lead.id,
              userId,
              action: "STATUS_CHANGE",
              description: `Lead status updated due to new inquiry`,
              metadata: { inquiryId: newInquiry.id },
            },
          });
        }

        const product = await tx.product.findUnique({
          where: { id: newInquiry.productId },
          select: { name: true },
        });

        await tx.contactHistory.create({
          data: {
            leadId: clientCheck.lead.id,
            user: { connect: { id: userId } },
            method: "Inquiry Form",
            summary: `New inquiry for ${
              product?.name || "Unknown Product"
            }, quantity: ${data.quantity}`,
            outcome: "New inquiry created",
          },
        });
      }

      return newInquiry;
    });

    return inquiry as Inquiry & { product: Product | null };
  }

  async update(
    id: string,
    data: UpdateInquiryDto,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    const currentInquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true, createdBy: true, product: true },
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
          product: true,
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
              action: "STATUS_CHANGE",
              description: `Lead status updated due to inquiry status change to ${data.status}`,
              metadata: { inquiryId: id },
            },
          });

          await tx.contactHistory.create({
            data: {
              leadId: currentInquiry.relatedLead.id,
              userId,
              method: "System Update",
              summary: `Inquiry status changed to ${data.status}`,
              outcome: `Lead status updated to ${newLeadStatus}`,
            },
          });
        }
      }

      return updatedInquiry as Inquiry & { product: Product | null };
    });
  }

  async createQuote(
    id: string,
    quoteDetails: QuoteDetails,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true, product: true },
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
          product: true,
        },
      });

      if (inquiry.relatedLead) {
        const oldStatus = inquiry.relatedLead.status;
        const newStatus = LeadStatus.ProposalSent;

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
            action: "QUOTE_CREATED",
            description: `Quote created for ${
              inquiry.product?.name || "Unknown Product"
            }, amount: ${quoteDetails.totalPrice}`,
            metadata: { inquiryId: id, ...quoteDetails },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "Quote",
            userId,
            summary: `Quote of ${quoteDetails.totalPrice} sent for ${
              inquiry.product?.name || "Unknown Product"
            }`,
            outcome: "Awaiting Client response",
          },
        });
      }

      return updatedInquiry as Inquiry & { product: Product | null };
    });
  }

  async approveInquiry(
    id: string,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    return this.updateInquiryStatus(
      id,
      "Approved",
      "Negotiation",
      "Quote accepted by client",
      userId
    );
  }

  async scheduleInquiry(
    id: string,
    scheduledDate: Date,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { relatedLead: true, createdBy: true, product: true },
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
          product: true,
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
            action: "DELIVERY_SCHEDULED",
            description: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }`,
            metadata: { inquiryId: id, scheduledDate },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            method: "System Update",
            summary: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }`,
            outcome: "Awaiting delivery",
          },
        });
      }

      return updatedInquiry as Inquiry & { product: Product | null };
    });
  }

  async fulfillInquiry(
    id: string,
    userId: string
  ): Promise<Inquiry & { product: Product | null }> {
    return this.updateInquiryStatus(
      id,
      "Fulfilled",
      "Won",
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
  ): Promise<Inquiry & { product: Product | null }> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { relatedLead: true, createdBy: true, product: true },
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
          product: true,
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
            action: "STATUS_CHANGE",
            description: `Lead status updated due to inquiry status change to ${inquiryStatus}`,
            metadata: { inquiryId: id },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            method: "System Update",
            summary: `Inquiry status changed to ${inquiryStatus}`,
            outcome,
          },
        });
      }

      return updatedInquiry as Inquiry & { product: Product | null };
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
      by: ["productId"],
      _count: {
        productId: true,
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

    const monthlyDataBigInt = await prisma.$queryRaw<MonthlyDataRaw[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Inquiry"
      WHERE "createdAt" >= ${sixMonthsAgo} AND "createdAt" <= ${currentDate} 
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    const totalInquiries = Number(totalInquiriesBigInt);
    const convertedCount = Number(convertedCountBigInt);

    const byStatus = statusCountsBigInt.map((item) => ({
      status: item.status,
      count: Number(item._count.status),
    }));

    const bySource = sourceCountsBigInt.map((item) => ({
      source: item.referenceSource,
      count: Number(item._count.referenceSource),
    }));

    const productIds = productTypeCountsBigInt
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const byProductType = productTypeCountsBigInt.map((item) => ({
      productType: productMap.get(item.productId!) || "Unknown Product",
      count: Number(item._count.productId),
    }));

    const monthlyTrends = monthlyDataBigInt.map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    return {
      totalInquiries,
      byStatus,
      bySource,
      byProductType,
      monthlyTrends,
      conversionRate:
        totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0,
    };
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(id: string, userId: string): Promise<ConversionResult> {
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

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
        company = await tx.company.create({
          data: {
            name: `${inquiry.clientName}'s Company`,
            email: inquiry.email,
            phone: inquiry.phoneNumber,
          },
        });
      }

      let leadStatus: LeadStatus = "New";

      switch (inquiry.status) {
        case "New":
          leadStatus = "New";
          break;
        case "Quoted":
          leadStatus = "ProposalSent";
          break;
        case "Approved":
          leadStatus = "Negotiation";
          break;
        case "Scheduled":
          leadStatus = "Qualified";
          break;
        case "Fulfilled":
          leadStatus = "Won";
          break;
        case "Cancelled":
          leadStatus = "New";
          break;
        default:
          leadStatus = "New";
      }

      const lead = await tx.lead.create({
        data: {
          companyId: company.id,
          contactPerson: inquiry.clientName ?? "Unknown",
          name:
            inquiry.clientName ??
            inquiry.companyName ??
            `Lead from Inquiry ${inquiry.id.substring(0, 8)}`,

          email: inquiry.email ?? "unknown@example.com",
          phone: inquiry.phoneNumber,
          status: leadStatus,
          source: "Inquiry",
          estimatedValue: inquiry.quotedPrice || null,
          createdById: userId,
          assignedToId: userId,
          notes: `Converted from inquiry (Product: ${
            inquiry.product?.name || "Unknown"
          }). Original remarks: ${inquiry.remarks || "None"}`,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.contactHistory.create({
        data: {
          leadId: lead.id,
          userId,
          method: "Inquiry Form",
          summary: `Initial inquiry for ${
            inquiry.product?.name || "Unknown Product"
          } submitted through inquiry form`, // CHANGED: Added product name to summary
          outcome: "Converted to lead",
        },
      });

      // Update inquiry to link it to the lead
      await tx.inquiry.update({
        where: { id },
        data: {
          status: InquiryStatus.Approved, // Or some other appropriate status for a converted inquiry
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
  ): Promise<Inquiry & { product: Product | null }> {
    try {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, 
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.Cancelled,
          updatedAt: new Date(),
        },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
      });

      return updatedInquiry as Inquiry & { product: Product | null };
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
  ): Promise<Inquiry & { product: Product | null }> {
    // Add Product to return type
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
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
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
      });

      return updatedInquiry as Inquiry & { product: Product | null };
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
  ): Promise<Inquiry & { product: Product | null }> {
    // Add Product to return type
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
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
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
      });

      return updatedInquiry as Inquiry & { product: Product | null };
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
  ): Promise<Inquiry & { product: Product | null }> {
    // Add Product to return type
    try {
      // Check if inquiry exists
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
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
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        }, // ADDED: include product
      });

      return updatedInquiry as Inquiry & { product: Product | null };
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
          ? "ProposalSent"
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
        return "Won" as LeadStatus; // Changed 'Converted' to 'Won' as per your LeadStatus enum
      case "Cancelled": // If an inquiry is cancelled, the lead should ideally go to Lost
        return "Lost" as LeadStatus;
      default:
        return currentLeadStatus;
    }
  }
}
