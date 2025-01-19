import { google } from "googleapis";
import authenticate from "../services/oauth";
import { prisma } from "../config/prisma";

const SPREADSHEET_ID = "14po4OtRqWuyY4SrMv1e-WNO_06QQld1QDtsJRRgrI44";

interface ParsedSheetData {
    sheetName: string;
    headers: readonly string[];
    rows: Record<string, string>[];
}

export interface SaveResult {
    processedRows: number;
    errors: Error[];
}


export const sheetConfig = {
    Manufacturer: [
        "SN",
        "Company Name",
        "Contact or landline",
        "Email",
        "Location",
        "Website",
        "Owner",
        "Company Details",
        "Remarks/Notes",
    ],
    "Construction Database": [
        "SN",
        "Company Name",
        "Email ",
        "Region",
        "Category",
        "Address",
        "Authorized Managing Officer",
        "Designation/Position ",
        "Contact Number ",
        "Type",
        "Classification",
        "Kinds of Project and Respective Size Ranges:",
    ],
    "PCAB ONLINE": [
        "",
        "Name Of Firm",
        "Contact Person",
        "Email",
        "Contact Number",
        "License Number",
        "Region",
        "Category",
        "Principal Classification",
        "Type",
        "CFY",
        "Valid From",
        "Valid To",
        "Reg.For Gov.Infra.Projects",
    ],
    "Database-NCR Reference": [
        "",
        "Name Of Firm",
        "License Number",
        "Region",
        "Category",
        "Principal Classification",
        "Type",
        "CFY",
        "Valid From",
        "Valid To",
        "Reg.For Gov.Infra.Projects",
        "Email",
        "Number",
    ],
} as const;

export type SheetName = keyof typeof sheetConfig;

export async function fetchSheetData(sheetName: SheetName): Promise<ParsedSheetData> {
    try {
        console.log(`[DEBUG] Starting to fetch sheet: ${sheetName}`);
        
        const authClient = await authenticate();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        if (!authClient) {
            throw new Error('Authentication failed');
        }

        // Get metadata
        const metadataResponse = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
            ranges: [sheetName],
            includeGridData: false,
        });

        // Find the sheet with case-insensitive comparison
        const sheet = metadataResponse.data.sheets?.find(s => 
            s.properties?.title?.toUpperCase() === sheetName.toUpperCase()
        );

        if (!sheet || !sheet.properties?.title) {
            const availableSheets = metadataResponse.data.sheets
                ?.map(s => s.properties?.title)
                .filter(Boolean)
                .join(', ');
            throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${availableSheets}`);
        }

        // Use the exact sheet title from the metadata
        const exactSheetTitle = sheet.properties.title;
        
        // Get the actual data using the exact sheet title with correct valueRenderOption
        const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${exactSheetTitle}!A1:Z`,
            valueRenderOption: 'FORMATTED_VALUE',  // Changed from 'FORMATTED_STRING' to 'FORMATTED_VALUE'
        });

        const rows = dataResponse.data.values;
        if (!rows || rows.length === 0) {
            return { sheetName, headers: sheetConfig[sheetName], rows: [] };
        }

        const [headerRow, ...dataRows] = rows;

        // Get the configured headers for this sheet
        const validHeaders = sheetConfig[sheetName];
        
        // Create a mapping between actual column positions and expected headers
        const headerMapping = validHeaders.map(expectedHeader => {
            const columnIndex = headerRow.findIndex(actualHeader => 
                actualHeader?.toString().trim().toLowerCase() === expectedHeader.toLowerCase()
            );
            return { expectedHeader, columnIndex };
        });

        console.log('[DEBUG] Header mapping:', {
            foundHeaders: headerRow,
            expectedHeaders: validHeaders,
            mapping: headerMapping
        });

        // Parse rows using the header mapping
        const parsedRows = dataRows
            .filter(row => row.some(cell => cell !== null && cell !== ''))
            .map((row) => {
                return headerMapping.reduce<Record<string, string>>((acc, { expectedHeader, columnIndex }) => {
                    acc[expectedHeader] = columnIndex >= 0 ? (row[columnIndex] || '').toString().trim() : '';
                    return acc;
                }, {});
            });

        console.log(`[DEBUG] Successfully parsed ${parsedRows.length} rows from ${exactSheetTitle}`);
        if (parsedRows.length > 0) {
            console.log('[DEBUG] Sample row:', parsedRows[0]);
        }

        return { 
            sheetName, 
            headers: validHeaders, 
            rows: parsedRows 
        };

    } catch (error) {
        console.error('[DEBUG] Error details:', {
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : error,
            sheetName,
            spreadsheetId: SPREADSHEET_ID
        });
        throw error;
    }
}


export async function fetchAllSheets(): Promise<ParsedSheetData[]> {
    const sheetNames: SheetName[] = [
        "Manufacturer",
        "Construction Database",
        "PCAB ONLINE",
        "Database-NCR Reference",
    ];

    const allSheetsData = [];
    for (const sheetName of sheetNames) {
        const sheetData = await fetchSheetData(sheetName);
        allSheetsData.push(sheetData);
    }
    return allSheetsData;
}

export async function saveLeadsToDB(sheetName: string, rows: Record<string, string>[], batchSize = 10): Promise<SaveResult> {
    if (!(sheetName in sheetConfig)) {
        throw new Error(`Invalid sheet name: ${sheetName}`);
    }

    const totalRows = rows.length;
    console.log(`Starting to save ${totalRows} rows from ${sheetName}`);
    let processed = 0;
    let errors: Error[] = [];

    // Process the rows in batches
    while (processed < totalRows) {
        const batch = rows.slice(processed, processed + batchSize);
        const batchNumber = Math.ceil((processed + 1) / batchSize);
        const totalBatches = Math.ceil(totalRows / batchSize);

        const leadsToInsert = batch.map((row) => ({
            sheetName,
            data: row,
        }));

        try {
            await prisma.lead.createMany({
                data: leadsToInsert,
                skipDuplicates: true, // Optional: skip duplicate entries if you have unique constraints
            });

            processed += batch.length;
            console.log(`Processed batch ${batchNumber}/${totalBatches} (${processed}/${totalRows} rows)`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(new Error(`Error in batch ${batchNumber}: ${errorMessage}`));
            
            // Continue with next batch despite error
            processed += batch.length;
            console.error(`Error in batch ${batchNumber}/${totalBatches}:`, errorMessage);
        }
    }

    console.log(`Completed processing ${processed} rows from ${sheetName}`);
    if (errors.length > 0) {
        console.log(`Encountered ${errors.length} errors during processing`);
    }

    return {
        processedRows: processed,
        errors: errors
    };
}