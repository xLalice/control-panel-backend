import { prisma } from "../../config/prisma";
import { 
  Inquiry, 
  InquiryFilterParams, 
  PaginatedResponse, 
  CreateInquiryDto, 
  UpdateInquiryDto, 
  InquiryStatistics,
  ConversionResult,
  QuoteDetails,
  InquiryContactResponse
} from "./inquiry.types";
import { DeliveryMethod, InquiryStatus, LeadStatus, ReferenceSource } from "@prisma/client";

export class InquiryService {
  /**
   * Get all inquiries with pagination and filtering
   */
  async findAll(params: InquiryFilterParams): Promise<PaginatedResponse<Inquiry>> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      source, 
      productType,
      sortBy = "createdAt",
      sortOrder = "desc",
      search
    } = params;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const where: any = {};
    
    if (status) where.status = status;
    if (source) where.referenceSource = source;
    if (productType) where.productType = productType;
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Create sort object
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get inquiries with pagination
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
            email: true
          }
        },
        relatedLead: true
      }
    });
    
    // Get total count for pagination
    const total = await prisma.inquiry.count({ where });
    
    return {
      data: inquiries as Inquiry[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single inquiry by ID
   */
  async findById(id: string): Promise<Inquiry | null> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        relatedLead: {
          include: {
            company: true,
            contactHistory: {
              orderBy: {
                timestamp: 'desc'
              }
            }
          }
        }
      }
    });
    
    return inquiry as Inquiry | null;
  }

  /**
   * Check if customer exists in the system (as a lead or company)
   */
  async checkCustomerExists(params: { 
    email?: string, 
    phoneNumber?: string, 
    companyName?: string 
  }): Promise<InquiryContactResponse> {
    const { email, phoneNumber, companyName } = params;
    
    // Search criteria
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phoneNumber) whereConditions.push({ phone: phoneNumber });
    
    // Check if company exists
    let existingCompany = null;
    if (companyName) {
      existingCompany = await prisma.company.findUnique({
        where: { name: companyName }
      });
    }
    
    // Check if lead exists with any of the identifying information
    let existingLead = null;
    if (whereConditions.length > 0 || existingCompany) {
      const leadQuery: any = { OR: [] };
      
      // Add direct conditions
      if (whereConditions.length > 0) {
        leadQuery.OR = whereConditions;
      }
      
      // Add company condition
      if (existingCompany) {
        leadQuery.OR.push({ companyId: existingCompany.id });
      }
      
      existingLead = await prisma.lead.findFirst({
        where: leadQuery,
        include: {
          company: true,
          contactHistory: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }
    
    return {
      exists: !!(existingCompany || existingLead),
      lead: existingLead,
      company: existingCompany
    };
  }

  /**
   * Create a new inquiry
   */
  async create(data: CreateInquiryDto, userId: string): Promise<Inquiry> {
    // Check if customer exists first
    const customerCheck = await this.checkCustomerExists({
      email: data.email,
      phoneNumber: data.phoneNumber,
      companyName: data.isCompany ? data.companyName : undefined
    });
    
    // Build the inquiry data
    const inquiryData: any = {
      ...data,
      preferredDate: new Date(data.preferredDate),
      createdById: userId,
      deliveryMethod: data.deliveryMethod as DeliveryMethod,
      referenceSource: data.referenceSource as ReferenceSource,
      deliveryLocation: data.deliveryLocation ?? "",
      status: "New"
    };
    
    // If there's an existing lead, link it
    if (customerCheck.lead) {
      inquiryData.relatedLeadId = customerCheck.lead.id;
    }
    
    // Create the inquiry in a transaction
    const inquiry = await prisma.$transaction(async (tx) => {
      // Create the inquiry
      const newInquiry = await tx.inquiry.create({
        data: inquiryData
      });
      
      // If there's an existing lead, update its status and create activity log
      if (customerCheck.lead) {
        const oldStatus = customerCheck.lead.status;
        const newStatus = this.determineLeadStatusFromInquiry("New", oldStatus);
        
        if (oldStatus !== newStatus) {
          await tx.lead.update({
            where: { id: customerCheck.lead.id },
            data: { 
              status: newStatus,
              lastContactDate: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Create activity log for status change
          await tx.activityLog.create({
            data: {
              leadId: customerCheck.lead.id,
              userId,
              createdById: userId,
              action: "STATUS_CHANGE",
              description: `Lead status updated due to new inquiry`,
              oldStatus,
              newStatus,
              metadata: { inquiryId: newInquiry.id }
            }
          });
        }
        
        // Create contact history entry
        await tx.contactHistory.create({
          data: {
            leadId: customerCheck.lead.id,
            method: "Inquiry Form",
            summary: `New inquiry for ${data.productType}, quantity: ${data.quantity}`,
            outcome: "New inquiry created"
          }
        });
      }
      
      return newInquiry;
    });
    
    return inquiry as Inquiry;
  }

  /**
   * Update an existing inquiry
   */
  async update(id: string, data: UpdateInquiryDto, userId: string): Promise<Inquiry> {
    // Get the current inquiry to check for status changes
    const currentInquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true }
    });
    
    if (!currentInquiry) {
      throw new Error("Inquiry not found");
    }
    
    const updateData: any = {
      ...data,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined
    };
    
    return prisma.$transaction(async (tx) => {
      // Update the inquiry
      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: updateData,
        include: {
          relatedLead: true
        }
      });
      
      // If status changed and there's a related lead, update the lead status
      if (data.status && data.status !== currentInquiry.status && currentInquiry.relatedLead) {
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
              updatedAt: new Date()
            }
          });
          
          // Create activity log for status change
          await tx.activityLog.create({
            data: {
              leadId: currentInquiry.relatedLead.id,
              userId,
              createdById: userId,
              action: "STATUS_CHANGE",
              description: `Lead status updated due to inquiry status change to ${data.status}`,
              oldStatus: oldLeadStatus,
              newStatus: newLeadStatus,
              metadata: { inquiryId: id }
            }
          });
          
          // Create contact history entry
          await tx.contactHistory.create({
            data: {
              leadId: currentInquiry.relatedLead.id,
              method: "System Update",
              summary: `Inquiry status changed to ${data.status}`,
              outcome: `Lead status updated to ${newLeadStatus}`
            }
          });
        }
      }
      
      return updatedInquiry as Inquiry;
    });
  }

  /**
   * Create a quote for an inquiry
   */
  async createQuote(id: string, quoteDetails: QuoteDetails, userId: string): Promise<Inquiry> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { relatedLead: true }
    });
    
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }
    
    return prisma.$transaction(async (tx) => {
      // Update inquiry with quote information and status
      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: {
          status: "Quoted",
          quotedPrice: quoteDetails.totalPrice,
          quotedBy: userId,
          quotedAt: new Date()
        },
        include: {
          relatedLead: true
        }
      });
      
      // If there's a related lead, update it
      if (inquiry.relatedLead) {
        const oldStatus = inquiry.relatedLead.status;
        const newStatus = 'Proposal' as LeadStatus; // Move to proposal stage when quoted
        
        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            status: newStatus,
            estimatedValue: quoteDetails.totalPrice,
            lastContactDate: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create activity log for the quote
        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            createdById: userId,
            action: "QUOTE_CREATED",
            description: `Quote created for ${inquiry.productType}, amount: ${quoteDetails.totalPrice}`,
            oldStatus,
            newStatus,
            metadata: { inquiryId: id, ...quoteDetails }
          }
        });
        
        // Create contact history entry
        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "Quote",
            summary: `Quote of ${quoteDetails.totalPrice} sent for ${inquiry.productType}`,
            outcome: "Awaiting customer response"
          }
        });
      }
      
      return updatedInquiry as Inquiry;
    });
  }

  /**
   * Update inquiry status to Approved
   */
  async approveInquiry(id: string, userId: string): Promise<Inquiry> {
    return this.updateInquiryStatus(id, "Approved", "Negotiation", "Quote accepted by customer", userId);
  }
  
  /**
   * Update inquiry status to Scheduled
   */
  async scheduleInquiry(id: string, scheduledDate: Date, userId: string): Promise<Inquiry> {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id },
        include: { relatedLead: true }
      });
      
      if (!inquiry) {
        throw new Error("Inquiry not found");
      }
      
      // Update the inquiry
      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: {
          status: "Scheduled",
          preferredDate: scheduledDate
        },
        include: {
          relatedLead: true
        }
      });
      
      // Update the lead if it exists
      if (inquiry.relatedLead) {
        const oldStatus = inquiry.relatedLead.status;
        
        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            lastContactDate: new Date(),
            updatedAt: new Date(),
            followUpDate: scheduledDate // Set follow-up to delivery date
          }
        });
        
        // Create activity log
        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            createdById: userId,
            action: "DELIVERY_SCHEDULED",
            description: `Delivery scheduled for ${scheduledDate.toISOString().split('T')[0]}`,
            oldStatus,
            newStatus: oldStatus, // Status doesn't change at this point
            metadata: { inquiryId: id, scheduledDate }
          }
        });
        
        // Create contact history entry
        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "System Update",
            summary: `Delivery scheduled for ${scheduledDate.toISOString().split('T')[0]}`,
            outcome: "Awaiting delivery"
          }
        });
      }
      
      return updatedInquiry as Inquiry;
    });
  }
  
  /**
   * Update inquiry status to Fulfilled
   */
  async fulfillInquiry(id: string, userId: string): Promise<Inquiry> {
    return this.updateInquiryStatus(id, "Fulfilled", "Converted", "Order successfully fulfilled", userId);
  }

  /**
   * Helper method to update inquiry status with lead implications
   */
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
        include: { relatedLead: true }
      });
      
      if (!inquiry) {
        throw new Error("Inquiry not found");
      }
      
      // Update the inquiry
      const updatedInquiry = await tx.inquiry.update({
        where: { id },
        data: { status: inquiryStatus  },
        include: {
          relatedLead: true
        }
      });
      
      // Update the lead if it exists
      if (inquiry.relatedLead) {
        const oldStatus = inquiry.relatedLead.status;
        
        await tx.lead.update({
          where: { id: inquiry.relatedLead.id },
          data: {
            status: leadStatus,
            lastContactDate: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create activity log
        await tx.activityLog.create({
          data: {
            leadId: inquiry.relatedLead.id,
            userId,
            createdById: userId,
            action: "STATUS_CHANGE",
            description: `Lead status updated due to inquiry status change to ${inquiryStatus}`,
            oldStatus,
            newStatus: leadStatus,
            metadata: { inquiryId: id }
          }
        });
        
        // Create contact history entry
        await tx.contactHistory.create({
          data: {
            leadId: inquiry.relatedLead.id,
            method: "System Update",
            summary: `Inquiry status changed to ${inquiryStatus}`,
            outcome
          }
        });
      }
      
      return updatedInquiry as Inquiry;
    });
  }

  /**
   * Delete an inquiry
   */
  async delete(id: string): Promise<void> {
    await prisma.inquiry.delete({
      where: { id }
    });
  }

  /**
   * Get inquiry statistics
   */
  async getStatistics(startDate?: string | Date, endDate?: string | Date): Promise<InquiryStatistics> {
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
    
    // Get total count of inquiries
    const totalInquiries = await prisma.inquiry.count({ where });
    
    // Get inquiries by status
    const statusCounts = await prisma.inquiry.groupBy({
      by: ["status"],
      _count: {
        status: true
      },
      where
    });
    
    // Get inquiries by source
    const sourceCounts = await prisma.inquiry.groupBy({
      by: ["referenceSource"],
      _count: {
        referenceSource: true
      },
      where
    });
    
    // Get inquiries by product type
    const productTypeCounts = await prisma.inquiry.groupBy({
      by: ["productType"],
      _count: {
        productType: true
      },
      where
    });
    
    // Get conversion rate
    const convertedCount = await prisma.inquiry.count({
      where: {
        ...where,
        status: { in: ["Converted", "Fulfilled"] }
      }
    });
    
    // Get monthly trends
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "Inquiry"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
    
    return {
      totalInquiries,
      byStatus: statusCounts.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      bySource: sourceCounts.map(item => ({
        source: item.referenceSource,
        count: item._count.referenceSource
      })),
      byProductType: productTypeCounts.map(item => ({
        productType: item.productType,
        count: item._count.productType
      })),
      monthlyTrends: monthlyData as Array<{ month: Date; count: number }>,
      conversionRate: totalInquiries > 0 ? (convertedCount / totalInquiries) * 100 : 0
    };
  }

  /**
   * Convert inquiry to lead
   */
  async convertToLead(id: string, userId: string): Promise<ConversionResult> {
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id }
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
            region: null
          },
        });
      } else {
        // Create a new company based on customer name
        company = await tx.company.create({
          data: {
            name: `${inquiry.customerName}'s Company`, // Fallback company name
            email: inquiry.email,
            phone: inquiry.phoneNumber
          }
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
          notes: `Converted from inquiry. Original remarks: ${inquiry.remarks || "None"}`,
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        }
      });
      
      // Create contact history entry
      await tx.contactHistory.create({
        data: {
          leadId: lead.id,
          method: "Inquiry Form",
          summary: "Initial inquiry submitted through inquiry form",
          outcome: "Converted to lead",
        }
      });
      
      // Update inquiry to link it to the lead
      await tx.inquiry.update({
        where: { id },
        data: {
          status: InquiryStatus.Approved,
          relatedLeadId: lead.id
        }
      });
      
      return { lead, company };
    });
    
    return result;
  }
  
  /**
   * Determine the appropriate lead status based on inquiry status
   */
  private determineLeadStatusFromInquiry(inquiryStatus: string, currentLeadStatus: LeadStatus): LeadStatus {
    // Logic to determine lead status based on inquiry status
    switch (inquiryStatus) {
      case "New":
        // For new inquiries, don't downgrade lead status
        return currentLeadStatus;
      case "Quoted":
        // Move to proposal stage when quoted, but don't downgrade
        return (currentLeadStatus === "New" || currentLeadStatus === "Contacted") 
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