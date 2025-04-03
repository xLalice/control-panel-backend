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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const lead_utils_1 = require("./lead.utils");
class LeadService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createLead(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { companyId, companyName, source, status = "New", assignedToId, email, phone } = data, leadData = __rest(data, ["companyId", "companyName", "source", "status", "assignedToId", "email", "phone"]);
            console.log("Creating lead with data:", data);
            if (!companyId && !companyName) {
                console.error("Failed to create lead: Either Company ID or Company Name is required");
                throw new Error("Either Company ID or Company Name is required to create a lead");
            }
            if (!source) {
                console.error("Failed to create lead: Source is required");
                throw new Error("Source is required to create a lead");
            }
            const assignedTo = assignedToId && assignedToId.trim() !== ""
                ? { connect: { id: assignedToId } }
                : undefined;
            let company;
            if (companyId) {
                company = yield this.prisma.company.findUnique({
                    where: { id: companyId },
                });
                if (!company) {
                    console.error("Failed to create lead: Company ID not found");
                    throw new Error("Invalid Company ID: No company found");
                }
            }
            else if (companyName) {
                company = yield this.prisma.company.findFirst({
                    where: { name: companyName },
                });
                if (!company) {
                    company = yield this.prisma.company.create({
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
            const lead = yield this.prisma.lead.create({
                data: Object.assign(Object.assign({}, leadData), { company: { connect: { id: company.id } }, source,
                    status,
                    assignedTo, createdBy: { connect: { id: userId } } }),
            });
            yield this.prisma.activityLog.create({
                data: {
                    leadId: lead.id,
                    userId: lead.assignedToId || "Unassigned",
                    action: "Created",
                    description: `Lead created at ${new Date().toISOString()}`,
                    oldStatus: lead.status,
                    newStatus: status,
                    metadata: { notes: lead.notes },
                    createdById: userId,
                },
            });
            console.log("Lead created successfully:", lead);
            return lead;
        });
    }
    updateLead(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { companyId, assignedToId, companyName } = data, leadData = __rest(data, ["companyId", "assignedToId", "companyName"]);
            console.log("Updating lead with data:", data);
            return this.prisma.lead.update({
                where: { id },
                data: Object.assign(Object.assign({}, leadData), { company: companyId ? { connect: { id: companyId } } : undefined, assignedTo: assignedToId && assignedToId.trim() !== ""
                        ? { connect: { id: assignedToId } }
                        : { disconnect: true } }),
            });
        });
    }
    updateLeadStatus(id_1, _a, userId_1) {
        return __awaiter(this, arguments, void 0, function* (id, { status, notes, method }, userId) {
            const lead = yield this.prisma.lead.findUnique({
                where: { id },
                include: { contactHistory: true },
            });
            if (!lead)
                throw new Error("Lead not found");
            const updateLastContactStates = [
                "Contacted",
                "Qualified",
                "Proposal",
                "Converted",
            ];
            const updateData = Object.assign({ status }, (updateLastContactStates.includes(status) && {
                lastContactDate: new Date(),
            }));
            yield this.prisma.activityLog.create({
                data: {
                    leadId: id,
                    userId: lead.assignedToId || "system",
                    action: "Status Change",
                    description: `Lead status changed from ${lead.status} to ${status}`,
                    oldStatus: lead.status,
                    newStatus: status,
                    metadata: { notes },
                    createdById: userId,
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
        });
    }
    deleteLead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.lead.delete({
                where: { id },
            });
        });
    }
    getLead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.lead.findUnique({
                where: { id },
                include: { company: true, assignedTo: true, contactHistory: true },
            });
        });
    }
    getLeads(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            let { search, status, assignedTo, page = 1, pageSize = 20, sortBy, sortOrder = "desc", } = filters;
            pageSize = Number(pageSize);
            const where = {
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
            const orderBy = Object.assign({}, (sortBy ? (0, lead_utils_1.getSortingConfig)(sortBy, sortOrder) : { createdAt: "desc" }));
            // Get total count
            const total = yield this.prisma.lead.count({ where });
            // Get paginated leads
            const leads = yield this.prisma.lead.findMany({
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
        });
    }
    getCompanies() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.company.findMany();
        });
    }
    assignLead(id, data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lead = yield this.prisma.lead.findUnique({ where: { id } });
            if (!lead)
                throw new Error("Lead not found");
            // Convert "unassigned" to null
            const assignedToId = data.assignedToId === "unassigned" ? null : data.assignedToId;
            if (lead.assignedToId === assignedToId) {
                throw new Error("Lead is already assigned to this user or unassigned");
            }
            // If it's not "unassigned", validate that the user exists
            if (assignedToId) {
                const assignedUser = yield this.prisma.user.findUnique({
                    where: { id: assignedToId },
                });
                if (!assignedUser) {
                    throw new Error("Assigned user not found");
                }
            }
            yield this.createActivityLog({
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
            }, userId);
            return this.prisma.lead.update({
                where: { id },
                data: {
                    assignedToId,
                    lastContactDate: new Date(),
                },
            });
        });
    }
    createActivityLog(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.activityLog.create({
                data: Object.assign(Object.assign({}, data), { createdById: userId }),
            });
        });
    }
    getLeadActivities(leadId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.activityLog.findMany({
                where: { leadId },
                orderBy: { createdAt: "desc" },
            });
        });
    }
}
exports.LeadService = LeadService;
