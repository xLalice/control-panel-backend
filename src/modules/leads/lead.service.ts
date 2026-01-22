import {
  PrismaClient,
  Lead,
  LeadStatus,
  ActivityLog,
  Company,
  Client,
  ContactHistory as PrismaContactHistory
} from "../../../prisma/generated/prisma/client";
import {
  AssignLeadDto,
  SearchLeadsParams,
  PaginatedLeadsResponse,
} from "./lead.types";
import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
} from "./lead.schema";
import { Prisma } from "@prisma/client";
import { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { getSortingConfig } from "./lead.utils";
import { AddContactHistoryData, ContactHistory } from "../clients/client.types";

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  async createLead(data: CreateLeadDto, userId: string): Promise<Lead> {
    const {
      companyId,
      companyName,
      source,
      status = "New",
      assignedToId,
      email,
      phone,
      name,
      ...leadData
    } = data;


    const assignedTo =
      assignedToId && assignedToId.trim() !== ""
        ? { connect: { id: assignedToId } }
        : undefined;

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

    const statusEnumValue = data.status
      ? LeadStatus[data.status as keyof typeof LeadStatus]
      : undefined;

    const lead = await this.prisma.lead.create({
      data: {
        ...leadData,
        name,
        email,
        ...(company?.id && { company: { connect: { id: company.id } } }),
        source,
        status: statusEnumValue,
        assignedTo,
        createdBy: { connect: { id: userId } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        leadId: lead.id,
        userId: userId,
        action: "Created",
        description: `Lead created at ${new Date().toISOString()}`,
        metadata: { notes: lead.notes },
      },
    });

    return lead;
  }

  async updateLead(
    id: string,
    data: UpdateLeadDto,
    userId: string
  ): Promise<Lead> {

    const oldLead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        company: true,
        assignedTo: true,
      },
    });

    if (!oldLead) {
      throw new Error(`Lead with ID ${id} not found.`);
    }

    const { companyId, assignedToId, companyName, ...leadData } = data;

    const statusEnumValue = data.status
      ? LeadStatus[data.status as keyof typeof LeadStatus]
      : undefined;

    const updateData: Prisma.LeadUpdateInput = {
      ...leadData,
      status: statusEnumValue,
    };

    if (companyId !== undefined) {
      if (companyId.trim() === "") {
        updateData.company = { disconnect: true };
      } else {
        updateData.company = { connect: { id: companyId } };
      }
    } else if (companyName && companyName.trim() !== "") {
      const existingCompany = await this.prisma.company.findUnique({
        where: { name: companyName.trim() },
      });

      if (existingCompany) {
        updateData.company = { connect: { id: existingCompany.id } };
      } else {
        const newCompany = await this.prisma.company.create({
          data: { name: companyName.trim() },
        });
        updateData.company = { connect: { id: newCompany.id } };
      }
    }

    if (assignedToId !== undefined) {
      if (assignedToId.trim() !== "") {
        updateData.assignedTo = { connect: { id: assignedToId } };
      } else {
        updateData.assignedTo = { disconnect: true };
      }
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        assignedTo: true,
      },
    });

    const changes: { field: string; old: any; new: any }[] = [];
    const descriptionParts: string[] = [];

    const addChange = (
      field: string,
      oldVal: string | null | undefined | number,
      newVal: string | null | undefined | number,
      label: string
    ) => {
      if (oldVal !== newVal) {
        changes.push({ field, old: oldVal, new: newVal });
        descriptionParts.push(
          `${label} changed from '${oldVal || "N/A"}' to '${newVal || "N/A"}'`
        );
      }
    };

    addChange("name", oldLead.name, updatedLead.name, "Lead Name");
    addChange(
      "contactPerson",
      oldLead.contactPerson,
      updatedLead.contactPerson,
      "Contact Person"
    );
    addChange("email", oldLead.email, updatedLead.email, "Email");
    addChange("phone", oldLead.phone, updatedLead.phone, "Phone");
    addChange("status", oldLead.status, updatedLead.status, "Status");
    addChange(
      "estimatedValue",
      oldLead.estimatedValue?.toString(),
      updatedLead.estimatedValue?.toString(),
      "Estimated Value"
    );
    addChange(
      "leadScore",
      oldLead.leadScore,
      updatedLead.leadScore,
      "Lead Score"
    );
    addChange("source", oldLead.source, updatedLead.source, "Source");
    addChange("notes", oldLead.notes, updatedLead.notes, "Notes");

    const oldCompanyName = oldLead.company?.name || null;
    const newCompanyName = updatedLead.company?.name || null;
    if (oldCompanyName !== newCompanyName) {
      changes.push({
        field: "companyId",
        old: oldCompanyName,
        new: newCompanyName,
      });
      descriptionParts.push(
        `Company changed from '${oldCompanyName || "N/A"}' to '${
          newCompanyName || "N/A"
        }'`
      );
    }

    const oldAssignedToName = oldLead.assignedTo?.name || null;
    const newAssignedToName = updatedLead.assignedTo?.name || null;
    if (oldAssignedToName !== newAssignedToName) {
      changes.push({
        field: "assignedToId",
        old: oldAssignedToName,
        new: newAssignedToName,
      });
      descriptionParts.push(
        `Assigned To changed from '${oldAssignedToName || "N/A"}' to '${
          newAssignedToName || "N/A"
        }'`
      );
    }

    if (changes.length > 0) {
      let actionDescription = `Lead updated: ${descriptionParts.join(", ")}`;
      if (descriptionParts.length === 0) {
        actionDescription = "Lead details updated.";
      }

      await this.prisma.activityLog.create({
        data: {
          leadId: updatedLead.id,
          userId: userId,
          action: "LEAD_UPDATED",
          description: actionDescription,
          metadata: changes,
        },
      });
    }

    return updatedLead;
  }

  async updateLeadStatus(
    id: string,
    { status, notes, method }: UpdateLeadStatusDto,
    userId: string
  ): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { contactHistory: true, company: true },
    });

    if (!lead) throw new Error("Lead not found");

    const updateLastContactStates = [
      "Contacted",
      "Qualified",
      "Proposal Sent",
      "Won",
    ];

    const updateData: any = {
      ...(status !== undefined && { status: status }),
      ...(updateLastContactStates.includes(status as string) && {
        lastContactDate: new Date(),
      }),
    };

    await this.prisma.activityLog.create({
      data: {
        leadId: id,
        userId: userId,
        action: "Status Change",
        description: `Lead status changed from ${lead.status} to ${status}`,
        metadata: { notes },
      },
    });

    if (status === "Won") {
      await this.prisma.client.create({
        data: {
          companyId: lead.companyId,
          clientName: lead.contactPerson || lead?.company?.name || "Unknown",
          primaryEmail: lead.email,
          primaryPhone: lead.phone,
          notes: lead.notes,
          convertedFromLeadId: lead.id,
        },
      });

      await this.prisma.lead.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
    }

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
      include: {
        company: true,
        assignedTo: true,
        contactHistory: true,
        client: true,
      },
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
                { name: { contains: search, mode: "insensitive" } },
                {
                  company: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {},
        status ? { status } : {},
        assignedTo
          ? { assignedToId: assignedTo === "unassigned" ? null : assignedTo }
          : {},
      ],
    };

    const orderBy: Prisma.LeadOrderByWithRelationInput = {
      ...(sortBy ? getSortingConfig(sortBy, sortOrder) : { createdAt: "desc" }),
    };

    const total = await this.prisma.lead.count({ where });

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        company: { select: { name: true, email: true, phone: true } },
        contactPerson: true,
        estimatedValue: true,
        source: true,
        email: true,
        phone: true,
        status: true,
        assignedTo: { select: { name: true } },
        createdAt: true,
        lastContactDate: true,
        followUpDate: true,
        leadScore: true,
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

    const assignedToId =
      data.assignedToId === "unassigned" ? null : data.assignedToId;

    if (lead.assignedToId === assignedToId) {
      throw new Error("Lead is already assigned to this user or unassigned");
    }

    if (assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!assignedUser) {
        throw new Error("Assigned user not found");
      }
    }

    await this.createActivityLog(
      {
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
      },
      userId
    );

    return this.prisma.lead.update({
      where: { id },
      data: {
        assignedToId,
        lastContactDate: new Date(),
      },
    });
  }

  async createActivityLog(
    data: {
      leadId: string;
      userId: string;
      createdById?: string;
      action: string;
      description: string;
      method?: string;
      metadata?: JsonObject;
      oldStatus?: LeadStatus;
      newStatus?: LeadStatus;
    },
    userId: string
  ): Promise<void> {
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
      include: {
        user: true,
      },
    });
  }

  async getContactHistory(leadId: string): Promise<PrismaContactHistory[]> {
    return this.prisma.contactHistory.findMany({
      where: { leadId },
      orderBy: { timestamp: "desc" },
      include: {
        user: true,
      },
    });
  }

  async addContactHistory(
    leadId: string,
    data: Omit<AddContactHistoryData, "entity">
  ): Promise<ContactHistory> {
    try {
      const createdContact = await this.prisma.contactHistory.create({
        data: {
          method: data.method,
          summary: data.summary,
          outcome: data.outcome,
          timestamp: data.timestamp,
          userId: data.userId,
          leadId: leadId,
          clientId: null,
        },
        include: {
          user: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true } },
        },
      });

      const formattedContact: ContactHistory = {
        id: createdContact.id,
        method: createdContact.method,
        summary: createdContact.summary,
        outcome: createdContact.outcome || undefined,
        timestamp: createdContact.timestamp,
        user: createdContact.user
          ? { id: createdContact.user.id, name: createdContact.user.name }
          : undefined,
        lead: createdContact.lead
          ? { id: createdContact.lead.id, name: createdContact.lead.name }
          : undefined,
        client: undefined,
      };

      return formattedContact;
    } catch (error) {
      console.error(`Error adding contact history for lead ${leadId}:`, error);
      throw new Error(`Failed to add contact history for lead.`);
    }
  }

  async convertLeadToClient(
    leadId: string,
    convertedById: string
  ): Promise<Client> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true },
    });

    if (!lead) {
      throw new Error("Lead does not exist.");
    }

    if (lead.status !== "Won") {
      throw new Error(
        "Cannot convert a lead that has not been won. Current status: " +
          lead.status
      );
    }

    const clientName =
      lead.company?.name ||
      lead.contactPerson ||
      `Client from Lead ${lead.id.substring(0, 8)}`;

    return await this.prisma.$transaction(async (tx) => {
      const clientCreationData: Prisma.ClientCreateInput = {
        clientName: clientName,
        primaryEmail: lead.email,
        primaryPhone: lead.phone,
        status: "Active",
        notes: `Converted from Lead ID: ${lead.id}. Original lead name: ${lead.name}.`,
        convertedFromLead: { connect: { id: lead.id } },
        ...(lead.companyId && { company: { connect: { id: lead.companyId } } }),
      };

      const createdClient = await tx.client.create({
        data: clientCreationData,
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "Won",
          client: { connect: { id: createdClient.id } },
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await tx.contactHistory.updateMany({
        where: { leadId: lead.id },
        data: { clientId: createdClient.id, leadId: null },
      });

      await tx.activityLog.updateMany({
        where: { leadId: lead.id },
        data: { clientId: createdClient.id, leadId: null },
      });

      await tx.activityLog.create({
        data: {
          leadId: lead.id,
          clientId: createdClient.id,
          userId: convertedById,
          action: "LEAD_CONVERTED_TO_CLIENT",
          description: `Lead "${lead.name}" (ID: ${lead.id}) converted to Client "${createdClient.clientName}" (ID: ${createdClient.id}).`,
          metadata: {
            leadId: lead.id,
            clientId: createdClient.id,
            oldLeadStatus: lead.status,
            newLeadStatus: "ConvertedToClient" as JsonValue,
          },
        },
      });

      return createdClient;
    });
  }
}
