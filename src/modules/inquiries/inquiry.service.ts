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
  ScheduleOptions,
  DailyDataRaw,
} from "./inquiry.types";
import {
  DeliveryMethod,
  InquiryStatus,
  LeadStatus,
  ReferenceSource,
  Priority,
  Inquiry,
  Product,
  Lead,
  Prisma,
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
        },
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
          product: { connect: { id: data.product } },
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
    userId: string,
    options?: ScheduleOptions
  ): Promise<
    Inquiry & {
      product: Product | null;
      relatedLead: Lead | null;
      createdBy: any;
    }
  > {
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
          priority: options?.priority || inquiry.priority,
          remarks: options?.notes || inquiry.remarks,
        },
        include: {
          relatedLead: true,
          createdBy: true,
          product: true,
        },
      });

      if (inquiry.relatedLead) {
        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            lastContactDate: new Date(),
            updatedAt: new Date(),
            followUpDate: scheduledDate,
          },
        });

        // Activity Log for Lead
        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            action: "DELIVERY_SCHEDULED",
            description: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }. ${options?.priority ? `Priority: ${options.priority}.` : ""} ${
              options?.notes ? `Notes: ${options.notes}.` : ""
            }`,
            metadata: {
              inquiryId: id,
              scheduledDate: scheduledDate.toISOString(),
              priority: options?.priority,
              notes: options?.notes,
              reminderMinutes: options?.reminderMinutes,
            },
          },
        });
        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            method: "System Update",
            summary: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }. ${options?.notes ? `Notes: ${options.notes}.` : ""}`,
            outcome: "Awaiting delivery",
          },
        });
      }

      return updatedInquiry as Inquiry & {
        product: Product | null;
        relatedLead: Lead | null;
        createdBy: any;
      };
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
    endDate?: string | Date,
    includeDailyTrends: boolean = false
  ): Promise<InquiryStatistics> {
    const where: any = {};
    const dateFilterParams: Date[] = [];

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    let rawDateFilterClause = "";
    const rawQueryParams: Prisma.Sql[] = []; 

    const defaultStartDate = new Date("1900-01-01");
    const defaultEndDate = new Date(); 

    const filterGte = startDate ? new Date(startDate) : defaultStartDate;
    const filterLte = endDate ? new Date(endDate) : defaultEndDate;

    rawDateFilterClause = `WHERE "createdAt" >= $1 AND "createdAt" <= $2`;
    rawQueryParams.push(Prisma.sql`${filterGte}`);
    rawQueryParams.push(Prisma.sql`${filterLte}`);

    const [
      totalInquiriesBigInt,
      statusCountsBigInt,
      referenceSourceCountsBigInt,
      inquiryTypeCountsBigInt,
      priorityCountsBigInt,
      deliveryMethodCountsBigInt,
      productTypeCountsBigInt,
      convertedCountBigInt,
      monthlyDataBigInt,
      dailyDataBigInt,
      averageQuoteTimeBigInt,
      overdueQuotesBigInt,
      quoteValueStats,
    ] = await Promise.all([
      prisma.inquiry.count({ where }),

      prisma.inquiry.groupBy({
        by: ["status"],
        _count: { status: true },
        where,
      }),

      prisma.inquiry.groupBy({
        by: ["referenceSource"],
        _count: { referenceSource: true },
        where,
      }),

      prisma.inquiry.groupBy({
        by: ["inquiryType"],
        _count: { inquiryType: true },
        where,
      }),

      prisma.inquiry.groupBy({
        by: ["priority"],
        _count: { priority: true },
        where: {
          ...where,
          priority: { not: null },
        },
      }),

      prisma.inquiry.groupBy({
        by: ["deliveryMethod"],
        _count: { deliveryMethod: true },
        where,
      }),

      prisma.inquiry.groupBy({
        by: ["productId"],
        _count: { productId: true },
        where,
      }),

      prisma.inquiry.count({
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
      }),

      // Monthly trends with status breakdown
      this.getMonthlyTrends(filterGte, filterLte), // Pass actual Date objects

      // Daily trends (optional)
      includeDailyTrends
        ? this.getDailyTrends(filterGte, filterLte)
        : Promise.resolve([]),

      // Average response time (hours between creation and first quote)
      // Use Prisma.sql to safely inject the parameter
      prisma.$queryRaw<Array<{ avg_hours: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("quotedAt" - "createdAt")) / 3600) as avg_hours
        FROM "Inquiry"
        WHERE "quotedAt" IS NOT NULL
        AND "createdAt" >= ${filterGte} AND "createdAt" <= ${filterLte}
      `,

      // Overdue quotes (quoted but not responded within 48 hours)
      prisma.inquiry.count({
        where: {
          ...where,
          status: InquiryStatus.Quoted,
          quotedAt: {
            lt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
          },
        },
      }),

      // Quote value statistics
      prisma.inquiry.aggregate({
        where: {
          ...where,
          quotedPrice: { not: null },
        },
        _avg: { quotedPrice: true },
        _sum: { quotedPrice: true },
        _count: { quotedPrice: true },
      }),
    ]);

    // ... (rest of the processing and return statement remains the same) ...
    // Convert BigInt values to numbers
    const totalInquiries = Number(totalInquiriesBigInt);
    const convertedCount = Number(convertedCountBigInt);
    const overdueQuotes = Number(overdueQuotesBigInt);

    // Process status data
    const byStatus = statusCountsBigInt.map((item) => ({
      status: item.status,
      count: Number(item._count.status),
    }));

    // Process reference source data
    const byReferenceSource = referenceSourceCountsBigInt.map((item) => ({
      referenceSource: item.referenceSource,
      count: Number(item._count.referenceSource),
    }));

    // Process inquiry type data
    const byInquiryType = inquiryTypeCountsBigInt.map((item) => ({
      inquiryType: item.inquiryType,
      count: Number(item._count.inquiryType),
    }));

    // Process priority data
    const byPriority = priorityCountsBigInt.map((item) => ({
      priority: item.priority || "Unassigned",
      count: Number(item._count.priority),
    }));

    // Process delivery method data
    const byDeliveryMethod = deliveryMethodCountsBigInt.map((item) => ({
      deliveryMethod: item.deliveryMethod,
      count: Number(item._count.deliveryMethod),
    }));

    // Process product data with names
    const productIds = productTypeCountsBigInt
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const byProductType = productTypeCountsBigInt.map((item) => ({
      productType: productMap.get(item.productId!) || "Unknown Product",
      count: Number(item._count.productId),
    }));

    const topProducts = await this.getTopProductsWithConversion(
      filterGte,
      filterLte,
      productMap
    );

    const monthlyTrends = monthlyDataBigInt.map((item) => ({
      month: item.month,
      count: Number(item.count),
      fulfilled: Number(item.fulfilled),
      cancelled: Number(item.cancelled),
    }));

    // Process daily trends (if requested)
    const dailyTrends = dailyDataBigInt.map((item) => ({
      date: item.date,
      count: Number(item.count),
    }));

    // Calculate active inquiries
    const activeInquiries = byStatus
      .filter((s) => !["Fulfilled", "Cancelled"].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    // Calculate average response time
    const averageResponseTime = averageQuoteTimeBigInt[0]?.avg_hours || 0;

    // Quote value metrics
    const avgQuoteValue = Number(quoteValueStats._avg.quotedPrice) || 0;
    const totalQuoteValue = Number(quoteValueStats._sum.quotedPrice) || 0;

    return {
      totalInquiries,
      conversionRate:
        totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0,
      byStatus,
      byReferenceSource,
      byInquiryType,
      byPriority,
      byDeliveryMethod,
      byProductType,
      monthlyTrends,
      dailyTrends: includeDailyTrends ? dailyTrends : undefined,
      averageResponseTime,
      topProducts,
      performanceMetrics: {
        activeInquiries,
        overdueQuotes,
        avgQuoteValue,
        totalQuoteValue,
      },
    };
  }

  private async getMonthlyTrends(
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyDataRaw[]> {
    return await prisma.$queryRaw<MonthlyDataRaw[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'Fulfilled' THEN 1 END) as fulfilled,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled
      FROM "Inquiry"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
  }

  private async getDailyTrends(
    startDate: Date,
    endDate: Date
  ): Promise<DailyDataRaw[]> {
    return await prisma.$queryRaw<DailyDataRaw[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM "Inquiry"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;
  }

  private async getTopProductsWithConversion(
    startDate: Date,
    endDate: Date,
    productMap: Map<string, string>
  ): Promise<
    Array<{ productName: string; count: number; conversionRate: number }>
  > {
    const productStats = await prisma.$queryRaw<
      Array<{
        product_id: string;
        total_count: bigint;
        converted_count: bigint;
      }>
    >`
      SELECT
        "productId" as product_id,
        COUNT(*) as total_count,
        COUNT(CASE WHEN status IN ('Approved', 'Scheduled', 'Fulfilled') THEN 1 END) as converted_count
      FROM "Inquiry"
      WHERE "productId" IS NOT NULL AND "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY "productId"
      ORDER BY total_count DESC
      LIMIT 10
    `;

    return productStats.map((stat) => {
      const totalCount = Number(stat.total_count);
      const convertedCount = Number(stat.converted_count);

      return {
        productName: productMap.get(stat.product_id) || "Unknown Product",
        count: totalCount,
        conversionRate:
          totalCount > 0 ? (convertedCount / totalCount) * 100 : 0,
      };
    });
  }

  async getConversionFunnelData(startDate?: Date, endDate?: Date) {
    // Define default dates if not provided
    const filterGte = startDate || new Date("1900-01-01");
    const filterLte = endDate || new Date();

    const funnelData = await prisma.$queryRaw<
      Array<{
        status: string;
        count: bigint;
        avg_days_in_status: number;
      }>
    >`
      SELECT
        status,
        COUNT(*) as count,
        AVG(
          CASE
            WHEN "updatedAt" != "createdAt"
            THEN EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400
            ELSE 0
          END
        ) as avg_days_in_status
      FROM "Inquiry"
      WHERE "createdAt" >= ${filterGte} AND "createdAt" <= ${filterLte}
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'New' THEN 1
          WHEN 'Quoted' THEN 2
          WHEN 'Approved' THEN 3
          WHEN 'Scheduled' THEN 4
          WHEN 'Fulfilled' THEN 5
          WHEN 'Cancelled' THEN 6
          ELSE 7
        END
    `;

    return funnelData.map((item) => ({
      status: item.status,
      count: Number(item.count),
      avgDaysInStatus: Math.round(item.avg_days_in_status * 10) / 10,
    }));
  }

  async getRevenueProjections(startDate?: Date, endDate?: Date) {
    // Define default dates if not provided
    const filterGte = startDate || new Date("1900-01-01");
    const filterLte = endDate || new Date();

    const projections = await prisma.inquiry.aggregate({
      where: {
        quotedPrice: { not: null },
        status: {
          in: [
            InquiryStatus.Quoted,
            InquiryStatus.Approved,
            InquiryStatus.Scheduled,
          ],
        },
        createdAt: {
          gte: filterGte,
          lte: filterLte,
        },
      },
      _sum: { quotedPrice: true },
      _count: { quotedPrice: true },
      _avg: { quotedPrice: true },
    });

    return {
      potentialRevenue: Number(projections._sum.quotedPrice) || 0,
      averageQuoteValue: Number(projections._avg.quotedPrice) || 0,
      pendingQuotes: Number(projections._count.quotedPrice) || 0,
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
            inquiry.clientName ??
            inquiry.companyName ??
            `Lead from Inquiry ${inquiry.id.substring(0, 8)}`
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
          } submitted through inquiry form`, 
          outcome: "Converted to lead",
        },
      });

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
    assignedById: string,
    assignedToId: string | null
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

      const oldAssignedToName =
        existingInquiry.assignedTo?.name || "unassigned";

      if (!assignedToId) {
        const updatedInquiry = await prisma.inquiry.update({
          where: { id: inquiryId },
          data: {
            assignedTo: { disconnect: true },
            updatedAt: new Date(),
          },
          include: {
            createdBy: true,
            assignedTo: true,
            relatedLead: true,
            product: true,
          },
        });

        await prisma.activityLog.create({
          data: {
            leadId: existingInquiry.relatedLeadId,
            userId: assignedById,
            action: "INQUIRY_UNASSIGNED",
            description: `Inquiry "${existingInquiry.clientName}" (ID: ${inquiryId}) unassigned from ${oldAssignedToName}`,
            metadata: {
              inquiryId: inquiryId,
              oldAssignedToId: existingInquiry.assignedToId,
              oldAssignedToName: oldAssignedToName,
            },
          },
        });

        return updatedInquiry as Inquiry & { product: Product | null };
      }

      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignedUser) {
        throw new Error(`User with ID ${assignedToId} not found`);
      }

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          assignedTo: { connect: { id: assignedUser.id } },
          updatedAt: new Date(),
        },
        include: {
          createdBy: true,
          assignedTo: true,
          relatedLead: true,
          product: true,
        },
      });

      await prisma.activityLog.create({
        data: {
          leadId: existingInquiry.relatedLeadId,
          userId: assignedById,
          action: "INQUIRY_ASSIGNED",
          description: `Inquiry "${existingInquiry.clientName}" (ID: ${inquiryId}) assigned to ${assignedUser.name}`,
          metadata: {
            inquiryId: inquiryId,
            oldAssignedToId: existingInquiry.assignedToId,
            oldAssignedToName: oldAssignedToName,
            newAssignedToId: assignedUser.id,
            newAssignedToName: assignedUser.name,
          },
        },
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
