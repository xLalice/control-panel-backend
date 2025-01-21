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



export async function fetchSheetData(sheetName: string): Promise<ParsedSheetData> {
    try {
        const authClient = await authenticate();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1:Z`,
            valueRenderOption: "FORMATTED_VALUE",
        });

        const rows = dataResponse.data.values;
        if (!rows || rows.length === 0) {
            return { sheetName, headers: [], rows: [] };
        }

        const [headerRow, ...dataRows] = rows;

        const parsedRows = dataRows.map((row) =>
            headerRow.reduce((acc, header, index) => {
                acc[header] = row[index] || "";
                return acc;
            }, {} as Record<string, string>)
        );

        return {
            sheetName,
            headers: headerRow,
            rows: parsedRows,
        };
    } catch (error) {
        console.error(`Error fetching data for sheet: ${sheetName}`, error);
        throw error;
    }
}



export async function fetchAllSheets(): Promise<ParsedSheetData[]> {
    try {
        const authClient = await authenticate();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        const metadataResponse = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
            includeGridData: false,
        });

        const sheetNames = metadataResponse.data.sheets
            ?.map((sheet) => sheet.properties?.title)
            .filter(Boolean) as string[];
        
        console.log("Sheet Names: ", sheetNames);

        const allSheetsData = [];
        for (const sheetName of sheetNames) {
            const sheetData = await fetchSheetData(sheetName);
            allSheetsData.push(sheetData);
        }

        return allSheetsData;
    } catch (error) {
        console.error("Error fetching all sheets:", error);
        throw error;
    }
}


export async function saveLeadsToDB(sheetName: string, rows: Record<string, string>[], batchSize = 10): Promise<SaveResult> {
    const totalRows = rows.length;
    console.log(`Starting to save ${totalRows} rows from ${sheetName}`);
    let processed = 0;
    let errors: Error[] = [];

    while (processed < totalRows) {
        const batch = rows.slice(processed, processed + batchSize);
        const leadsToInsert = batch.map((row) => ({
            sheetName,
            data: row,
        }));

        try {
            await prisma.lead.createMany({
                data: leadsToInsert,
                skipDuplicates: true,
            });

            processed += batch.length;
            console.log(`Processed ${processed}/${totalRows} rows`);
        } catch (error) {
            errors.push(error as Error);
            processed += batch.length; // Skip problematic rows
            console.error("Error saving batch:", error);
        }
    }

    return {
        processedRows: processed,
        errors,
    };
}

export async function fetchSheetNames() {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const metadataResponse = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames = metadataResponse.data.sheets
        ?.map((sheet) => sheet.properties?.title)
        .filter(Boolean) || [];

    return sheetNames;
}