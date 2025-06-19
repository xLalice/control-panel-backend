import { includes } from "zod/v4";
import { prisma } from "../../config/prisma";
import {
  AssociateInquiryDataDto,
  CreateInquiryDto,
  InquiryWithItemsAndProducts,
  UpdateInquiryDto,
} from "./inquiry.schema";

import {
  InquiryFilterParams,
  PaginatedResponse,
  InquiryStatistics,
  ConversionResult,
  InquiryContactResponse,
  MonthlyDataRaw,
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
  InquiryItem,
  User,
  Company,
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
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        {
          items: {
            some: {
              product: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    const orderBy: any = {};
    if (sortBy === "assignedTo.name") {
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
        leadOriginated: true,
        items: {
          include: {
            product: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lead: true,
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
        lead: {
          include: {
            company: true,
            contactHistory: {
              orderBy: {
                timestamp: "desc",
              },
            },
          },
        },
        items: true,
      },
    });

    return inquiry as (Inquiry & { product: Product | null }) | null;
  }

  async checkClientExists(params: {
    email?: string;
    phoneNumber?: string;
    companyName?: string | null;
    clientName?: string;
  }): Promise<InquiryContactResponse> {
    const { email, phoneNumber, companyName, clientName } = params;

    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phone: phoneNumber });
    if (clientName) whereConditions.push({
      clientName
    })


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
  ): Promise<InquiryWithItemsAndProducts> {
    const clientCheck = await this.checkClientExists({
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.isCompany ? data.companyName : null,
    });

    const { items, ...inquiryBaseData } = data;

    const inquiry = await prisma.$transaction(async (tx) => {
      const newInquiry = await tx.inquiry.create({
        data: {
          ...inquiryBaseData,
          preferredDate:
            inquiryBaseData.preferredDate instanceof Date
              ? inquiryBaseData.preferredDate
              : inquiryBaseData.preferredDate
              ? new Date(inquiryBaseData.preferredDate as string)
              : null,

          lead: clientCheck.lead
            ? { connect: { id: clientCheck.lead.id } }
            : undefined,

          createdBy: { connect: { id: userId } },

          status: InquiryStatus.New,

          items: {
            createMany: {
              data: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                remarks: item.remarks,
              })),
            },
          },
        },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
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
              userId: userId,
              action: "Status Change",
              description: `Lead status updated due to new inquiry`,
              metadata: { inquiryId: newInquiry.id },
            },
          });
        }

        const productSummaries = newInquiry.items
          .map((item) => item.product?.name || "Unknown Product")
          .join(", ");

        await tx.contactHistory.create({
          data: {
            leadId: clientCheck.lead.id,
            userId: userId,
            method: "Inquiry Form",
            summary: `New inquiry for ${productSummaries}, quantities: ${newInquiry.items
              .map((item: InquiryItem) => item.quantity)
              .join(", ")}`,
            outcome: "New inquiry created",
          },
        });
      }

      return newInquiry;
    });
    return inquiry;
  }

  async update(
    id: string,
    data: UpdateInquiryDto,
    userId: string
  ): Promise<InquiryWithItemsAndProducts> {
    const currentInquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        lead: true,
        createdBy: true,
        items: true,
      },
    });

    if (!currentInquiry) {
      throw new Error("Inquiry not found");
    }

    const updateData: any = {
      ...data,
      preferredDate: data.preferredDate
        ? new Date(data.preferredDate)
        : undefined,
      products: undefined,
    };

    return prisma.$transaction(async (tx) => {
      if (data.items !== undefined) {
        await tx.inquiryItem.deleteMany({
          where: { inquiryId: id },
        });

        const newItemsToCreate = data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          remarks: item.remarks,
          inquiryId: id,
        }));

        if (newItemsToCreate.length > 0) {
          await tx.inquiryItem.createMany({
            data: newItemsToCreate,
          });
        }
      }

      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: updateData,
        include: {
          lead: true,
          createdBy: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (
        data.status &&
        data.status !== currentInquiry.status &&
        currentInquiry.lead
      ) {
        const oldLeadStatus = currentInquiry.lead.status;
        const newLeadStatus = this.determineLeadStatusFromInquiry(
          data.status,
          oldLeadStatus
        );

        if (oldLeadStatus !== newLeadStatus) {
          await tx.lead.update({
            where: { id: currentInquiry.lead.id },
            data: {
              status: newLeadStatus,
              lastContactDate: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.activityLog.create({
            data: {
              leadId: currentInquiry.lead.id,
              userId,
              action: "STATUS_CHANGE",
              description: `Lead status updated due to inquiry status change to ${data.status}`,
              metadata: { inquiryId: id },
            },
          });

          await tx.contactHistory.create({
            data: {
              leadId: currentInquiry.lead.id,
              userId: userId,
              method: "System Update",
              summary: `Inquiry status changed to ${data.status}`,
              outcome: `Lead status updated to ${newLeadStatus}`,
            },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          inquiryId: id,
          userId,
          action: "INQUIRY_UPDATE",
          description: `Inquiry details updated by user`,
          metadata: { updatedFields: Object.keys(data) },
        },
      });

      if (currentInquiry.leadId) {
        const productSummary = updatedInquiry.items
          .map((item) => item.product?.name || "Unknown Product")
          .join(", ");
        await tx.contactHistory.create({
          data: {
            leadId: currentInquiry.leadId,
            userId: userId,
            method: "Inquiry Update",
            summary: `Inquiry ${id} updated. Now includes: ${productSummary}. New status: ${updatedInquiry.status}`,
            outcome: "Inquiry details modified",
          },
        });
      }

      return updatedInquiry as InquiryWithItemsAndProducts;
    });
  }

  async reviewInquiry(
    id: string,
    userId: string
  ): Promise<InquiryWithItemsAndProducts> {
    return this.updateInquiryStatus(
      id,
      InquiryStatus.Reviewed,
      LeadStatus.Contacted,
      "Inquiry reviewed",
      userId
    );
  }

  async associateInquiry(
    inquiryId: string,
    data: AssociateInquiryDataDto,
    userId: string
  ): Promise<InquiryWithItemsAndProducts> {
    return prisma.$transaction(async (tx) => { 
      const inquiry = await tx.inquiry.findUnique({
        where: { id: inquiryId },
        select: {
          id: true,
          status: true,
          leadId: true,
          clientId: true,
          clientName: true,
          lead: { select: { id: true, status: true, contactPerson: true } },
          client: { select: { id: true, clientName: true } }, 
        },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found.");
      }

      let updateData: Prisma.InquiryUpdateInput = {}; 
      let newInquiryStatus: InquiryStatus;
      let logMessage: string;
      let associatedEntityName: string = "";

      if (data.type === "client") {
        const client = await tx.client.findUnique({
          where: { id: data.entityId },
        });
        if (!client) {
          throw new Error(`Client with ID ${data.entityId} not found.`);
        }

        updateData = {
          client: { connect: { id: data.entityId } }, 
          lead: { disconnect: true }, 
        };
        newInquiryStatus = InquiryStatus.AssociatedToClient;
        logMessage = `Inquiry associated with existing client: ${client.clientName}`;
        associatedEntityName = client.clientName;
      } else { 
        const lead = await tx.lead.findUnique({ where: { id: data.entityId } });
        if (!lead) {
          throw new Error(`Lead with ID ${data.entityId} not found.`);
        }

        updateData = {
          lead: { connect: { id: data.entityId } }, 
          client: { disconnect: true }
        };
        newInquiryStatus = InquiryStatus.ConvertedToLead;
        logMessage = `Inquiry associated with existing lead: ${
          lead.contactPerson || lead.id
        }`;
        associatedEntityName = lead.contactPerson || `Lead ID: ${lead.id}`;
      }

      const updatedInquiry = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          ...updateData,
          status: newInquiryStatus,
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          client: true,
          createdBy: true,
          assignedTo: true,
          items: { include: { product: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          inquiryId: inquiryId,
          userId: userId,
          action: "ASSOCIATION_CHANGE",
          description: logMessage,
          metadata: {
            associatedType: data.type,
            associatedId: data.entityId,
            associatedName: associatedEntityName,
            oldInquiryStatus: inquiry.status,
            newInquiryStatus: newInquiryStatus,
          },
        },
      });

      return updatedInquiry as InquiryWithItemsAndProducts;
    });
  }

  async closeInquiry(
    id: string,
    userId: string
  ): Promise<InquiryWithItemsAndProducts> {
    return this.updateInquiryStatus(
      id,
      InquiryStatus.Closed,
      null,
      "Inquiry closed",
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
      items: InquiryItem[] | null;
      createdBy: User | null;
    }
  > {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { createdBy: true, items: true },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: {
          preferredDate: scheduledDate,
          priority: options?.priority || inquiry.priority,
          remarks: options?.notes || inquiry.remarks,
          status: InquiryStatus.DeliveryScheduled,
        },
        include: {
          createdBy: true,
          items: true,
        },
      });
      const lead = await tx.lead.findUnique({
        where: { originatingInquiryId: inquiry.id },
      });

      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            lastContactDate: new Date(),
            updatedAt: new Date(),
            followUpDate: scheduledDate,
          },
        });

        await tx.activityLog.create({
          data: {
            leadId: lead.id,
            userId: userId,
            action: "Delivery Scheduled",
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
            leadId: lead.id,
            userId: userId,
            method: "System Update",
            summary: `Delivery scheduled for ${
              scheduledDate.toISOString().split("T")[0]
            }. ${options?.notes ? `Notes: ${options.notes}.` : ""}`,
            outcome: "Awaiting delivery",
          },
        });
      } else {
        console.warn(
          `Inquiry ${id} was scheduled but no associated Lead found to update or log activity.`
        );
      }

      return updatedInquiry;
    });
  }
  private async updateInquiryStatus(
    id: string,
    inquiryStatus: InquiryStatus,
    leadStatus: LeadStatus | null,
    outcome: string,
    userId: string
  ): Promise<InquiryWithItemsAndProducts> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: {
          lead: true,
          createdBy: true,
          items: { include: { product: true } },
          assignedTo: true,
        },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: { status: inquiryStatus },
        include: {
          lead: true,
          createdBy: true,
          assignedTo: true,
          items: { include: { product: true } },
        },
      });

      if (inquiry.lead && leadStatus !== null) {
        const oldStatus = inquiry.lead.status;

        await tx.lead.update({
          where: { id: inquiry.lead.id },
          data: {
            status: leadStatus,
            lastContactDate: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.activityLog.create({
          data: {
            leadId: inquiry.lead.id,
            userId: userId,
            action: "Status Change",
            description: `Lead status updated from ${oldStatus} to ${leadStatus} due to inquiry status change to ${inquiryStatus}`,
            metadata: {
              inquiryId: id,
              oldLeadStatus: oldStatus,
              newLeadStatus: leadStatus,
              newInquiryStatus: inquiryStatus,
            },
          },
        });

        await tx.contactHistory.create({
          data: {
            leadId: inquiry.lead.id,
            userId: userId,
            method: "System Update",
            summary: `Inquiry status changed to ${inquiryStatus}. Lead status changed to ${leadStatus}.`,
            outcome: outcome,
          },
        });
      } else {
        console.warn(
          `Inquiry ${id} status changed to ${inquiryStatus} but no associated Lead found to update.`
        );
      }

      return updatedInquiry;
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

      // Fixed: Query InquiryItem with proper join to Inquiry for date filtering
      prisma.inquiryItem.groupBy({
        by: ["productId"],
        _count: { productId: true },
        where: {
          inquiry: where.createdAt
            ? {
                createdAt: where.createdAt,
              }
            : {},
        },
      }),

      prisma.inquiry.count({
        where: {
          ...where,
          status: {
            in: [
              InquiryStatus.ConvertedToLead,
              InquiryStatus.AssociatedToClient,
            ],
          },
        },
      }),

      // Monthly trends with status breakdown
      this.getMonthlyTrends(filterGte, filterLte),

      // Daily trends (optional)
      includeDailyTrends
        ? this.getDailyTrends(filterGte, filterLte)
        : Promise.resolve([]),
    ]);

    // Convert BigInt values to numbers
    const totalInquiries = Number(totalInquiriesBigInt);
    const convertedCount = Number(convertedCountBigInt);

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
      converted: Number(item.converted),
      closed: Number(item.closed),
    }));

    const dailyTrends = dailyDataBigInt.map((item) => ({
      date: item.date,
      count: Number(item.count),
    }));

    const activeInquiries = byStatus
      .filter((s) => !["Closed"].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

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
      topProducts,
      performanceMetrics: {
        activeInquiries,
        avgResponseTime: 0,
        totalValue: 0,
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
        COUNT(CASE WHEN status = 'ConvertedToLead' OR status = 'AssociatedToClient' THEN 1 END) as converted,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed
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
    // Fixed: Query InquiryItem with JOIN to Inquiry for proper filtering
    const productStats = await prisma.$queryRaw<
      Array<{
        product_id: string;
        total_count: bigint;
        converted_count: bigint;
      }>
    >`
      SELECT
        ii."productId" as product_id,
        COUNT(*) as total_count,
        COUNT(CASE WHEN i.status IN ('ConvertedToLead', 'AssociatedToClient') THEN 1 END) as converted_count
      FROM "InquiryItem" ii
      JOIN "Inquiry" i ON ii."inquiryId" = i.id
      WHERE i."createdAt" >= ${startDate} AND i."createdAt" <= ${endDate}
      GROUP BY ii."productId"
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
          WHEN 'Reviewed' THEN 2
          WHEN 'ConvertedToLead' THEN 3
          WHEN 'AssociatedToClient' THEN 4
          WHEN 'QuotationGenerated' THEN 5
          WHEN 'Closed' THEN 6
          ELSE 7
        END
    `;

    return funnelData.map((item) => ({
      status: item.status,
      count: Number(item.count),
      avgDaysInStatus: Math.round(item.avg_days_in_status * 10) / 10,
    }));
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(id: string, userId: string): Promise<Lead> {
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const existingLead = await tx.lead.findFirst({
        where: {
          OR: [
            { originatingInquiryId: inquiry.id },
            { email: inquiry.email },
            { phone: inquiry.phoneNumber },
          ],
        },
      });

      if (existingLead) {
        return existingLead;
      }

      const productNames = inquiry.items
        .map((item) => item.product?.name)
        .filter(
          (name): name is string => typeof name === "string" && name.length > 0
        );

      const productList =
        productNames.length > 0 ? productNames.join(", ") : "Unknown Product";

      let company: Company;
      if (inquiry.isCompany && inquiry.companyName) {
        company = await tx.company.upsert({
          where: {
            name: inquiry.companyName,
          },
          update: {},
          create: {
            name: inquiry.companyName,
            email: inquiry.email ?? null,
            phone: inquiry.phoneNumber ?? null,
            industry: null,
            region: null,
          },
        });
      } else {
        company = await tx.company.create({
          data: {
            name: inquiry.clientName
              ? `${inquiry.clientName}'s Company`
              : `Lead Company ${inquiry.id.substring(0, 8)}`,
            email: inquiry.email ?? null,
            phone: inquiry.phoneNumber ?? null,
            industry: null,
            region: null,
          },
        });
      }

      let leadStatus: LeadStatus = LeadStatus.New;

      switch (inquiry.status) {
        case InquiryStatus.New:
          leadStatus = LeadStatus.New;
          break;
        case InquiryStatus.Reviewed:
          leadStatus = LeadStatus.Contacted;
          break;
        case InquiryStatus.ConvertedToLead:
          leadStatus = LeadStatus.Qualified;
          break;
        case InquiryStatus.AssociatedToClient:
          leadStatus = LeadStatus.Qualified;
          break;
        case InquiryStatus.QuotationGenerated:
          leadStatus = LeadStatus.ProposalSent;
          break;
        case InquiryStatus.Closed:
          leadStatus = LeadStatus.Lost;
          break;
        default:
          leadStatus = LeadStatus.New;
      }

      // --- Create the Lead ---
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
          estimatedValue: null,
          createdById: userId,
          assignedToId: userId,
          notes: `Converted from inquiry (Product: ${productList}). Original remarks: ${
            inquiry.remarks || "None"
          }`,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          originatingInquiryId: inquiry.id,
        },
      });

      await tx.contactHistory.create({
        data: {
          leadId: lead.id,
          userId: userId,
          method: "Inquiry Form",
          summary: `Initial inquiry for ${productList} submitted through inquiry form`,
          outcome: "Converted to lead",
        },
      });

      await tx.inquiry.update({
        where: { id },
        data: {
          status: InquiryStatus.ConvertedToLead,
          leadId: lead.id,
        },
      });

      return lead;
    });

    return result;
  }

  async cancelInquiry(
    inquiryId: string,
    cancelledById: string
  ): Promise<InquiryWithItemsAndProducts> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingInquiry = await tx.inquiry.findUnique({
          where: { id: inquiryId },
          include: {
            createdBy: true,
            assignedTo: true,
            lead: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!existingInquiry) {
          throw new Error(`Inquiry with ID ${inquiryId} not found`);
        }

        if (existingInquiry.status === InquiryStatus.Closed) {
          throw new Error(
            `Inquiry with ID ${inquiryId} is already closed and cannot be cancelled again.`
          );
        }

        const updatedInquiry = await tx.inquiry.update({
          where: { id: inquiryId },
          data: {
            status: InquiryStatus.Closed,
            updatedAt: new Date(),
          },
          include: {
            createdBy: true,
            assignedTo: true,
            lead: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (updatedInquiry.lead) {
          await tx.lead.update({
            where: { id: updatedInquiry.lead.id },
            data: {
              status: LeadStatus.Lost,
              lastContactDate: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.activityLog.create({
            data: {
              leadId: updatedInquiry.lead.id,
              userId: cancelledById,
              action: "Inquiry Cancelled",
              description: `Inquiry #${inquiryId} cancelled. Lead status updated to 'Lost'.`,
              metadata: {
                inquiryId: inquiryId,
                oldStatus: existingInquiry.status,
                newStatus: updatedInquiry.status,
              },
            },
          });

          await tx.contactHistory.create({
            data: {
              leadId: updatedInquiry.lead.id,
              userId: cancelledById,
              method: "System Update",
              summary: `Associated inquiry #${inquiryId} was cancelled.`,
              outcome: "Inquiry Cancelled",
            },
          });
        }
        return updatedInquiry;
      });
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
  ): Promise<InquiryWithItemsAndProducts> {
    try {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      const oldPriority = existingInquiry.priority; // Capture old priority for logging

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          priority,
          updatedAt: new Date(),
        },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (updatedInquiry.lead) {
        await prisma.activityLog.create({
          data: {
            leadId: updatedInquiry.lead.id,
            userId: updatedById,
            action: "Priority Change",
            description: `Inquiry #${inquiryId} priority changed from ${
              oldPriority || "None"
            } to ${priority}.`,
            metadata: {
              inquiryId: inquiryId,
              oldPriority: oldPriority,
              newPriority: priority,
            },
          },
        });

        await prisma.contactHistory.create({
          data: {
            leadId: updatedInquiry.lead.id,
            userId: updatedById,
            method: "System Update",
            summary: `Inquiry #${inquiryId} priority changed to ${priority}.`,
            outcome: "Priority updated",
          },
        });
      } else {
        console.log(
          `Inquiry ${inquiryId} priority updated, but no associated lead found for logging.`
        );
        await prisma.activityLog.create({
          data: {
            inquiryId: inquiryId,
            userId: updatedById,
            action: "Inquiry Priority Change",
            description: `Inquiry #${inquiryId} priority changed from ${
              oldPriority || "None"
            } to ${priority}.`,
            metadata: {
              inquiryId: inquiryId,
              oldPriority: oldPriority,
              newPriority: priority,
            },
          },
        });
      }

      return updatedInquiry;
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
  ): Promise<InquiryWithItemsAndProducts> {
    try {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!existingInquiry) {
        throw new Error(`Inquiry with ID ${inquiryId} not found`);
      }

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          dueDate,
          updatedAt: new Date(),
        },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedInquiry as InquiryWithItemsAndProducts;
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
  ): Promise<InquiryWithItemsAndProducts> {
    try {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          createdBy: true,
          assignedTo: true,
          lead: true,
          items: true,
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
            lead: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        await prisma.activityLog.create({
          data: {
            leadId: existingInquiry.leadId,
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

        return updatedInquiry as InquiryWithItemsAndProducts;
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
          lead: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          leadId: existingInquiry.leadId,
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

      return updatedInquiry as InquiryWithItemsAndProducts;
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
    switch (inquiryStatus) {
      case "New":
        return currentLeadStatus;
      case "Quoted":
        return currentLeadStatus === "New" || currentLeadStatus === "Contacted"
          ? "ProposalSent"
          : currentLeadStatus;
      case "Approved":
        // Move to negotiation when approved
        return "Negotiation";
      case "Scheduled":
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
