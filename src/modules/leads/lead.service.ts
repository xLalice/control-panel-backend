import {
  PrismaClient,
  Lead,
  LeadStatus,
  User,
  ActivityLog,
  Company,
} from "@prisma/client";
import {
  AssignLeadDto,
  CreateLeadDto,
  SearchLeadsParams,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  PaginatedLeadsResponse,
} from "./lead.types";
import { Prisma } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import { getSortingConfig } from "./lead.utils";

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  async createLead(data: CreateLeadDto): Promise<Lead> {
    const {
      companyId,
      companyName,
      source,
      status = "New",
      assignedToId,
      email,
      phone,
      ...leadData
    } = data;

    console.log("Creating lead with data:", data);

    if (!companyId && !companyName) {
      console.error(
        "Failed to create lead: Either Company ID or Company Name is required"
      );
      throw new Error(
        "Either Company ID or Company Name is required to create a lead"
      );
    }

    if (!source) {
      console.error("Failed to create lead: Source is required");
      throw new Error("Source is required to create a lead");
    }

    // 🚀 Allow unassigned leads by setting assignedToId to null if empty
    const assignedTo =
      assignedToId && assignedToId.trim() !== ""
        ? { connect: { id: assignedToId } }
        : undefined; // Do not include `connect` if it's empty

    let company;

    if (companyId) {
      company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        console.error("Failed to create lead: Company ID not found");
        throw new Error("Invalid Company ID: No company found");
      }
    } else if (companyName) {
      company = await this.prisma.company.findFirst({
        where: { name: companyName },
      });

      if (!company) {
        company = await this.prisma.company.create({
          data: {
            name: companyName,
            email: email || null,
            phone: phone || null,
          },
        });
      }
    }

    if (!company) {
      console.error("Failed to create lead: Company could not be determined");
      throw new Error("Company could not be determined for lead creation");
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...leadData,
        company: { connect: { id: company.id } },
        source,
        status,
        assignedTo,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        leadId: lead.id,
        userId: lead.assignedToId || "Unassigned",
        action: "Created",
        description: `Lead created at ${new Date().toISOString()}`,
        oldStatus: lead.status,
        newStatus: status,
        metadata: { notes: lead.notes },
      },
    });

    console.log("Lead created successfully:", lead);
    return lead;
  }

  async updateLead(id: string, data: UpdateLeadDto): Promise<Lead> {
    const { companyId, assignedToId, companyName, ...leadData } = data; 

    console.log("Updating lead with data:", data);

    return this.prisma.lead.update({
        where: { id },
        data: {
            ...leadData,
            company: companyId ? { connect: { id: companyId } } : undefined, 
            assignedTo: assignedToId && assignedToId.trim() !== "" 
                ? { connect: { id: assignedToId } } 
                : { disconnect: true }, 
        },
    });
}


  async updateLeadStatus(
    id: string,
    { status, notes, method }: UpdateLeadStatusDto
  ): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { contactHistory: true },
    });

    if (!lead) throw new Error("Lead not found");

    const updateLastContactStates = [
      "Contacted",
      "Qualified",
      "Proposal",
      "Converted",
    ];

    const updateData: any = {
      status,
      ...(updateLastContactStates.includes(status) && {
        lastContactDate: new Date(),
      }),
    };

    await this.prisma.activityLog.create({
      data: {
        leadId: id,
        userId: lead.assignedToId || "system",
        action: "Status Change",
        description: `Lead status changed from ${lead.status} to ${status}`,
        oldStatus: lead.status,
        newStatus: status,
        metadata: { notes },
      },
    });

    if (notes) {
      updateData.contactHistory = {
        create: [
          {
            method: method || "Follow-up",
            summary: notes,
            outcome: status,
          },
        ],
      };
    }

    return this.prisma.lead.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteLead(id: string): Promise<Lead> {
    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { company: true, assignedTo: true, contactHistory: true },
    });
  }

  async getLeads(filters: SearchLeadsParams): Promise<PaginatedLeadsResponse> {
    let {
      search,
      status,
      assignedTo,
      page = 1,
      pageSize = 20,
      sortBy,
      sortOrder = "desc",
    } = filters;

    pageSize = Number(pageSize);

    const where: Prisma.LeadWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { contactPerson: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                {
                  company: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {},
        status ? { status } : {},
        assignedTo ? { assignedToId: assignedTo } : {},
      ],
    };

    const orderBy: Prisma.LeadOrderByWithRelationInput = {
      ...(sortBy ? getSortingConfig(sortBy, sortOrder) : { createdAt: "desc" }),
    };

    // Get total count
    const total = await this.prisma.lead.count({ where });

    // Get paginated leads
    const leads = await this.prisma.lead.findMany({
      where,
      orderBy,
      select: {
        id: true,
        company: { select: { name: true, email: true, phone: true } },
        contactPerson: true,
        email: true,
        status: true,
        assignedTo: { select: { name: true } },
        createdAt: true,
        lastContactDate: true,
        followUpDate: true,
        leadScore: true,
        industry: true,
        region: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      leads,
      total,
    };
  }

  async getCompanies(): Promise<Company[]> {
    return this.prisma.company.findMany();
  }

  async assignLead(
    id: string,
    data: AssignLeadDto,
    userId: string
  ): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new Error("Lead not found");

    // Convert "unassigned" to null
    const assignedToId =
      data.assignedToId === "unassigned" ? null : data.assignedToId;

    if (lead.assignedToId === assignedToId) {
      throw new Error("Lead is already assigned to this user or unassigned");
    }

    // If it's not "unassigned", validate that the user exists
    if (assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignedUser) {
        throw new Error("Assigned user not found");
      }
    }

    await this.createActivityLog({
      leadId: id,
      userId,
      action: assignedToId ? "Reassignment" : "Unassignment",
      description: assignedToId
        ? `Lead reassigned to a new owner`
        : `Lead unassigned`,
      metadata: {
        previousAssignee: lead.assignedToId,
        newAssignee: assignedToId,
      },
    });

    return this.prisma.lead.update({
      where: { id },
      data: {
        assignedToId,
        lastContactDate: new Date(),
      },
    });
  }

  async createActivityLog(data: {
    leadId: string;
    userId: string;
    createdById?: string;
    action: string;
    description: string;
    method?: string;
    metadata?: JsonObject;
    oldStatus?: LeadStatus;
    newStatus?: LeadStatus;
  }): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        ...data,
      },
    });
  }

  async getLeadActivities(leadId: string): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });
  }
}
