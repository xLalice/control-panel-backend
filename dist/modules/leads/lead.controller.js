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
exports.LeadController = void 0;
const lead_service_1 = require("./lead.service");
const lead_schema_1 = require("./lead.schema");
const prisma_1 = require("../../config/prisma");
const console_1 = require("console");
const leadService = new lead_service_1.LeadService(prisma_1.prisma);
class LeadController {
    createLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                (0, console_1.info)("Creating lead");
                const validatedData = lead_schema_1.createLeadSchema.parse(req.body);
                (0, console_1.info)(validatedData);
                const lead = yield leadService.createLead(validatedData, req.user.id);
                (0, console_1.info)("Created lead: ", lead);
                res.status(201).json(lead);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error:", error);
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("Unknown error:", error);
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    updateLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const validatedData = lead_schema_1.updateLeadSchema.parse(req.body);
                const lead = yield leadService.updateLead(id, validatedData);
                res.json(lead);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error:", error);
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("Unknown error:", error);
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    updateLeadStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const validatedData = lead_schema_1.updateLeadStatusSchema.parse(req.body);
                const lead = yield leadService.updateLeadStatus(id, validatedData, req.user.id);
                res.json(lead);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error:", error);
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("Unknown error:", error);
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    deleteLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield leadService.deleteLead(id);
                res.status(204).send();
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    getLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const lead = yield leadService.getLead(id);
                if (!lead) {
                    res.status(404).json({ error: "Lead not found" });
                    return;
                }
                res.json(lead);
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    getLeads(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filters = req.query;
                console.log("Get leads called with filters:", filters);
                const filteredFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
                console.log("Filtered filters:", filteredFilters);
                const leads = yield leadService.getLeads(filteredFilters);
                console.log("Leads:", leads);
                res.json(leads);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error:", error);
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("An unknown error occurred");
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    getCompanies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companies = yield leadService.getCompanies();
                res.json(companies);
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    assignLead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const validatedData = lead_schema_1.assignLeadSchema.parse(req.body);
                const userId = req.user.id;
                const lead = yield leadService.assignLead(id, validatedData, userId);
                res.json(lead);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error("Error:", error);
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("Unknown error:", error);
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
    getLeadActivities(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const activities = yield leadService.getLeadActivities(id);
                res.json(activities);
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    res.status(400).json({ error: "An unknown error occurred" });
                }
            }
        });
    }
}
exports.LeadController = LeadController;
