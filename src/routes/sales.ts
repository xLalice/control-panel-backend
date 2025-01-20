import express from "express";
import { prisma } from "../config/prisma";
import { fetchSheetData, fetchAllSheets, saveLeadsToDB, SheetName, sheetConfig, SaveResult } from "../services/googlesheet";

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

    console.log(`[DEBUG] Received request to fetch leads for sheet name: ${sheetName}`);

    if (!sheetName || typeof sheetName !== "string") {
        console.error(`[ERROR] Invalid sheet name: ${sheetName}`);
        return res.status(400).json({ error: "Sheet name is required and must be a string" });
    }

    // Decode sheet name, handle "+" replacement, and convert to snake case
    const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
    console.log(`[DEBUG] Transformed sheet name to snake_case: ${decodedSheetName}`);

    try {
        const leads = await prisma.lead.findMany({
            where: {
                sheetName: decodedSheetName,
            },
        });

        console.log(`[DEBUG] Found ${leads.length} leads for sheet name: ${decodedSheetName}`);

        if (leads.length === 0) {
            console.warn(`[WARNING] No leads found for sheet name: ${decodedSheetName}`);
            return res.status(404).json({ message: `No leads found for sheet name: ${decodedSheetName}` });
        }

        const parsedLeads = leads.map((lead) => lead.data);

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
router.post("/sync-lead/:sheetName", async (req, res): Promise<void> => {
    const { sheetName } = req.params;
    const decodedSheetName = decodeURIComponent(sheetName).replace(/\-/g, " ");
    console.log("Decoded sheet name: ", decodedSheetName);

    // Set a longer timeout for the request
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes

    if (!decodedSheetName || !(decodedSheetName in sheetConfig)) {
        res.status(400).json({ error: "Invalid or missing sheet name" });
        return;
    }

    try {
        // Fetch the data
        const sheetData = await fetchSheetData(decodedSheetName as SheetName);
        
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


export default router;
