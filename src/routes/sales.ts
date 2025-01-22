import express from "express";
import { prisma } from "../config/prisma";
import { fetchSheetData, fetchAllSheets, saveLeadsToDB, SaveResult, fetchSheetNames } from "../services/googlesheet";
import { Prisma } from "@prisma/client";

const router = express.Router();

router.get("/leads", async (req, res): Promise<any> => {
    const { sheetNames } = req.query;  // Get multiple sheet names from query params

    if (!sheetNames || !Array.isArray(sheetNames)) {
        return res.status(400).json({ error: "Sheet names are required and should be an array" });
    }

    try {
        // Query the database for leads from the specified sheets
        const leads = await prisma.lead.findMany({
            where: {
                sheetName: {
                    in: sheetNames as string[],  // Filter by multiple sheet names
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
    const { search } = req.query;

    console.log(`[DEBUG] Received request to fetch leads for sheet name: ${sheetName}`);
    console.log("Search", search);

    if (!sheetName || typeof sheetName !== "string") {
        console.error(`[ERROR] Invalid sheet name: ${sheetName}`);
        return res.status(400).json({ error: "Sheet name is required and must be a string" });
    }

    const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
    const searchQuery = typeof search === "string" ? search : "";

    try {
        const leads = await prisma.lead.findMany({
            where: {
                sheetName: decodedSheetName,
                ...(searchQuery && {
                    OR: [
                        {
                            data: {
                                path: ['Company Name'],
                                string_contains: searchQuery,
                            },
                        },
                        {
                            data: {
                                path: ['Name'],
                                string_contains: searchQuery,
                            },
                        },
                        {
                            data: {
                                path: ['Name Of Firm'],
                                string_contains: searchQuery,
                            },
                        },
                        {
                            data: {
                                path: ['Email'],
                                string_contains: searchQuery,
                            },
                        },
                    ],
                }),
            },
            orderBy: [{ id: "asc" }],
        });

        console.log(`[DEBUG] Found ${leads.length} leads for sheet name: ${decodedSheetName}`);

        if (leads.length === 0) {
            console.warn(`[WARNING] No leads found for sheet name: ${decodedSheetName}`);
            return res.status(404).json({ message: `No leads found for sheet name: ${decodedSheetName}` });
        }

        const parsedLeads = leads.map((lead) => {
            const data = lead.data as Prisma.JsonObject;
            return {
                id: lead.id,
                ...data,
            };
        });

        res.status(200).json({ sheetName: decodedSheetName, leads: parsedLeads });
    } catch (error) {
        console.error(`[ERROR] Error fetching leads for sheet ${decodedSheetName}:`, error);
        res.status(500).json({ error: "Error fetching leads" });
    }
});




router.post("/sync-leads", async (req, res) => {
    try {
        console.log("Syncing leads with Google Sheets...");
        const sheetsData = await fetchAllSheets();

        console.log("Fetching sheets done");
        console.log("Starting updating database");

        for (const sheet of sheetsData) {
            console.log(`Updating database for sheet: ${sheet.sheetName}`);
            await saveLeadsToDB(sheet.sheetName, sheet.rows);
        }

        console.log("Leads sync completed successfully.");
        res.status(200).json({ message: "Leads synced successfully!" });
    } catch (error) {
        console.error("Error syncing leads:", error);
        res.status(500).json({ error: "Error syncing leads" });
    }
});

// Modified router endpoint with timeout and response handling
router.post("/sync-lead/", async (req, res): Promise<void> => {
    const { sheetName } = req.body;
    const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
    console.log("Decoded sheet name: ", decodedSheetName);

    // Set a longer timeout for the request
    req.setTimeout(300000); // 5 minutes

    if (!decodedSheetName) {
        res.status(400).json({ error: "Invalid or missing sheet name" });
        return;
    }

    try {
        // Fetch the data
        const sheetData = await fetchSheetData(decodedSheetName as string);
        
        // Save the data and explicitly type the result
        const result: SaveResult = await saveLeadsToDB(decodedSheetName, sheetData.rows);

        // Send the response
        res.status(200).json({ 
            message: `Data from sheet ${decodedSheetName} has been fetched and saved.`,
            rowCount: sheetData.rows.length,
            processedRows: result.processedRows,
            errors: result.errors
        });
    } catch (error) {
        console.error(`Error processing sheet: ${decodedSheetName}`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ 
            error: `Failed to fetch and save sheet ${decodedSheetName}`,
            details: errorMessage
        });
    }
});

router.get("/sheets", async (req, res) => {
    try {
        const sheetNames = await fetchSheetNames();
        res.status(200).json({sheetNames});
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
      // First, fetch the existing lead
      const existingLead = await prisma.lead.findFirst({
        where: {
          id: parseInt(id),
          sheetName: decodedSheetName
        }
      });
  
      if (!existingLead) {
        res.status(404).json({ error: `Lead not found with id ${id} in sheet ${decodedSheetName}` });
        return;
      }
  
      // Merge the existing data with updates
      const updatedData = {
        ...existingLead.data as Record<string, any>,
        ...updates
      };
  
      // Update the lead
      const updatedLead = await prisma.lead.update({
        where: {
          id: parseInt(id)
        },
        data: {
          data: updatedData,
          updatedAt: new Date()
        }
      });
  
      res.status(200).json({
        message: "Lead updated successfully",
        lead: updatedLead
      });
  
    } catch (error) {
      console.error(`Error updating lead ${id} in sheet ${decodedSheetName}:`, error);
      res.status(500).json({
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });


export default router;
