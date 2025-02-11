import express from "express";
import { prisma } from "../config/prisma";
import {
  fetchSheetData,
  fetchAllSheets,
  saveLeadsToDB,
  SaveResult,
  fetchSheetNames,
} from "../services/googlesheet";
import { Prisma, LeadStatus } from "@prisma/client";
import { info } from "../utils/logger";

const JsonMultiCaseQuery = (
  path: string[],
  string_contains: string,
  jsonProperty: string = "data"
): Prisma.LeadWhereInput[] => {
  return [
    {
      [jsonProperty]: {
        path,
        string_contains,
      },
    },
    {
      [jsonProperty]: {
        path,
        string_contains: string_contains.toLowerCase(),
      },
    },
    {
      [jsonProperty]: {
        path,
        string_contains: string_contains.toUpperCase(),
      },
    },
    {
      [jsonProperty]: {
        path,
        string_contains:
          string_contains.charAt(0).toUpperCase() +
          string_contains.toLowerCase().slice(1),
      },
    },
  ];
};

const createMultiFieldSearch = (search: string): Prisma.LeadWhereInput => {
  return {
    OR: [
      ...JsonMultiCaseQuery(["Company Name"], search),
      ...JsonMultiCaseQuery(["Name"], search),
      ...JsonMultiCaseQuery(["Email"], search),
    ],
  };
};

// Helper function to validate LeadStatus
function isValidLeadStatus(status: string): boolean {
  const validStatuses = ['New', 'InProgress', 'Converted', 'Closed'];
  const isValid = validStatuses.includes(status);
  info(`Checking status validity: ${status} => ${isValid}`);
  return isValid;
}

const router = express.Router();

router.get("/leads", async (req, res): Promise<any> => {
  const { sheetNames } = req.query;

  if (!sheetNames || !Array.isArray(sheetNames)) {
    return res
      .status(400)
      .json({ error: "Sheet names are required and should be an array" });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        sheetName: {
          in: sheetNames as string[],
        },
      },
    });

    const groupedLeads = leads.reduce((acc, lead) => {
      if (!acc[lead.sheetName]) acc[lead.sheetName] = [];
      acc[lead.sheetName].push(lead.data);
      return acc;
    }, {} as Record<string, any[]>);

    res.status(200).json(groupedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Error fetching leads" });
  }
});

router.get("/leads/:sheetName", async (req, res): Promise<any> => {
  const { sheetName } = req.params;
  const { 
    search = "", 
    status, 
    assignedTo, 
    startDate, 
    endDate,
    page = "1",      // Default to first page
    limit = "20",    // Default to 20 items per page
    sortBy = "createdAt" // Default sorting by createdAt
  } = req.query;

  info("Received Query Params:", {
    sheetName,
    status,
    search,
    startDate,
    endDate,
    page,
    limit,
    assignedTo,
    sortBy
  });

  // Validate pagination parameters
  const pageNumber = parseInt(page as string, 10);
  const pageLimit = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  if (isNaN(pageLimit) || pageLimit < 1 || pageLimit > 100) {
    return res.status(400).json({ error: "Invalid page limit (1-100)" });
  }

  const offset = (pageNumber - 1) * pageLimit;

  if (!sheetName || typeof sheetName !== "string") {
    return res.status(400).json({ error: "Sheet name is required and must be a string" });
  }

  let parsedStartDate: Date | null = null;
  let parsedEndDate: Date | null = null;

  if (startDate && typeof startDate === "string") {
    if (isNaN(Date.parse(startDate))) {
      return res.status(400).json({ error: "Invalid startDate parameter" });
    }
    parsedStartDate = new Date(startDate);
  }

  if (endDate && typeof endDate === "string") {
    if (isNaN(Date.parse(endDate))) {
      return res.status(400).json({ error: "Invalid endDate parameter" });
    }
    parsedEndDate = new Date(endDate);
  }

  try {
    const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
    let whereConditions: Prisma.LeadWhereInput = {
      sheetName: decodedSheetName,
    };

    // Ensure AND is an array
    whereConditions.AND = Array.isArray(whereConditions.AND)
      ? whereConditions.AND
      : whereConditions.AND
      ? [whereConditions.AND]
      : [];

    // Add search conditions
    if (search && typeof search === "string") {
      whereConditions.AND.push(createMultiFieldSearch(search));
    }

    // Add status filter
    if (status && typeof status === "string") {
      info("Received Status: ", status);
      const isValid = isValidLeadStatus(status);
      info("Status Validation Result: ", isValid);
  
      if (!isValid) {
        return res.status(400).json({ 
          error: "Bad request: Invalid lead status",
          receivedStatus: status,
          validStatuses: ['New', 'InProgress', 'Converted', 'Closed']
        });
      }
  
      // Ensure exact enum match
      whereConditions.status = status as LeadStatus;
    }

    // Add date range filter
    if (parsedStartDate && parsedEndDate) {
      whereConditions.createdAt = {
        gte: parsedStartDate,
        lte: parsedEndDate,
      };
    }

    // Handle assignedTo filter (including Unassigned logic)
    if (assignedTo && typeof assignedTo === "string") {
      if (assignedTo === "Unassigned") {
        whereConditions.leadOwnerId = null; // Fetch leads with no assigned user
      } else {
        // Find the user by name and add to the where conditions
        const assignedUser = await prisma.user.findFirst({
          where: { name: assignedTo },
          select: { id: true }
        });
    
        if (assignedUser) {
          whereConditions.leadOwnerId = assignedUser.id;
        } else {
          // If no user found, return empty results
          return res.status(200).json({ 
            sheetName: decodedSheetName, 
            leads: [],
            message: "No leads found for the specified user" 
          });
        }
      }
    }

    const totalLeads = await prisma.lead.count({
      where: whereConditions
    });

    // Fetch all leads matching the conditions
    let leads = await prisma.lead.findMany({
      where: whereConditions,
      take: pageLimit,
      skip: offset,
    });

    // Sort the leads in memory if sortBy is specified
    if (sortBy === "Company Name" || sortBy === "Name" || sortBy === "Name of Firm") {
      leads.sort((a, b) => {
        const aValue = (a.data as Record<string, any>)[sortBy]?.toLowerCase() || "";
        const bValue = (b.data as Record<string, any>)[sortBy]?.toLowerCase() || "";
        return aValue.localeCompare(bValue);
      });
    }

    if (leads.length === 0) {
      return res.status(404).json({
        message: `No leads found for sheet name: ${decodedSheetName}`,
        pagination: {
          currentPage: pageNumber,
          totalPages: 0,
          totalLeads: 0,
          pageSize: pageLimit
        }
      });
    }

    const parsedLeads = leads.map((lead) => {
      const data = lead.data as Prisma.JsonObject;
      return { 
        id: lead.id, 
        status: lead.status,
        leadOwner: lead.leadOwnerId, 
        ...data 
      };
    });

    res.status(200).json({ 
      sheetName: decodedSheetName, 
      leads: parsedLeads,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalLeads / pageLimit),
        totalLeads: totalLeads,
        pageSize: pageLimit
      }
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Error fetching leads", details: error });
  }
});


router.post("/sync-leads", async (req, res) => {
  try {
    info("Syncing leads with Google Sheets...");
    const sheetsData = await fetchAllSheets();

    info("Fetching sheets done");
    info("Starting updating database");

    for (const sheet of sheetsData) {
      info(`Updating database for sheet: ${sheet.sheetName}`);
      await saveLeadsToDB(sheet.sheetName, sheet.rows);
    }

    info("Leads sync completed successfully.");
    res.status(200).json({ message: "Leads synced successfully!" });
  } catch (error) {
    console.error("Error syncing leads:", error);
    res.status(500).json({ error: "Error syncing leads" });
  }
});

router.post("/sync-lead", async (req, res): Promise<void> => {
  const { sheetName } = req.body;
  const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
  info("Decoded sheet name: ", decodedSheetName);

  req.setTimeout(300000); // 5 minutes

  if (!decodedSheetName) {
    res.status(400).json({ error: "Invalid or missing sheet name" });
    return;
  }

  try {
    const sheetData = await fetchSheetData(decodedSheetName);
    const result: SaveResult = await saveLeadsToDB(
      decodedSheetName,
      sheetData.rows
    );

    res.status(200).json({
      message: `Data from sheet ${decodedSheetName} has been fetched and saved.`,
      rowCount: sheetData.rows.length,
      processedRows: result.processedRows,
      errors: result.errors,
    });
  } catch (error) {
    console.error(`Error processing sheet: ${decodedSheetName}`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: `Failed to fetch and save sheet ${decodedSheetName}`,
      details: errorMessage,
    });
  }
});

router.get("/sheets", async (req, res) => {
  try {
    const sheetNames = await prisma.lead.findMany({
      distinct: ["sheetName"],
      select: {
        sheetName: true
      }
    })

    const uniqueSheetNames = sheetNames.map((sheet) => sheet.sheetName);
    res.status(200).json({ sheetNames: uniqueSheetNames });
  } catch (error) {
    console.error("Error fetching sheet names:", error);
    res.status(500).json({ error: "Failed to fetch sheet names" });
  }
});

router.patch("/leads/:sheetName/:id", async (req, res): Promise<void> => {
  const { sheetName, id } = req.params;
  const updates = req.body;

  if (!sheetName || !id || !updates) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");

  try {
    // Separate top-level fields from data fields
    const { status, ...dataUpdates } = updates;

    const existingLead = await prisma.lead.findFirst({
      where: {
        id: parseInt(id),
        sheetName: decodedSheetName,
      },
    });

    if (!existingLead) {
      res.status(404).json({
        error: `Lead not found with id ${id} in sheet ${decodedSheetName}`,
      });
      return;
    }

    // Merge only data-specific updates into existing data
    const updatedData = {
      ...(existingLead.data as Record<string, any>),
      ...dataUpdates,
    };

    const updatedLead = await prisma.lead.update({
      where: {
        id: parseInt(id),
      },
      data: {
        // Only update status if it's provided
        ...(status ? { status } : {}),
        data: updatedData,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error(
      `Error updating lead ${id} in sheet ${decodedSheetName}:`,
      error
    );
    res.status(500).json({
      error: "Failed to update lead",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});



export default router;