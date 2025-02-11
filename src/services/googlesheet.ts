import { google, Auth } from "googleapis";
import { prisma } from "../config/prisma";
import { info } from "../utils/logger";


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

// --------Authentication--------
export async function authenticate(): Promise<Auth.OAuth2Client> {
    // Fetch credentials from Prisma
    const credentials = await prisma.googleAuth.findFirst({
        where: { type: 'web' }
    });

    if (!credentials) {
        throw new Error('No credentials found in database.');
    }

    const { clientId, clientSecret, redirectUris } = credentials;

    // Parse redirectUris from JSON string to array
    const redirectUrisArray = JSON.parse(redirectUris) as string[];

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrisArray[0]);

    const token = await prisma.googleAuth.findFirst({
        where: { type: 'token' }
    });

    if (token) {
        oAuth2Client.setCredentials({
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
            expiry_date: token.expiryDate?.getTime(),
            token_type: token.tokenType
        });

        // Check if access token is expired and refresh if necessary
        if (token.expiryDate && token.expiryDate < new Date()) {
            info("Access token expired. Refreshing token...");
            const refreshedToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(refreshedToken.credentials);

            // Save the refreshed token to the database
            await prisma.googleAuth.update({
                where: { id: token.id },
                data: {
                    accessToken: refreshedToken.credentials.access_token,
                    expiryDate: refreshedToken.credentials.expiry_date ? new Date(refreshedToken.credentials.expiry_date) : null,
                    tokenType: refreshedToken.credentials.token_type
                }
            });
            info("Token refreshed and stored.");
        } else {
            info("Access token is still valid.");
        }
        return oAuth2Client;
    }

    return getNewToken(oAuth2Client);
}

function getNewToken(oAuth2Client: Auth.OAuth2Client): Promise<Auth.OAuth2Client> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    info("Authorize this app by visiting this url:", authUrl);

    return new Promise((resolve, reject) => {
        const rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Enter the code from that page here: ", (code: string) => {
            rl.close();
            oAuth2Client.getToken(code, async (err, token) => {
                if (err) {
                    console.error("Error retrieving access token:", err);
                    reject(err);
                    return;
                }

                // Check if token is null or undefined
                if (!token) {
                    console.error("Token is null or undefined.");
                    reject(new Error("Token is null or undefined."));
                    return;
                }

                oAuth2Client.setCredentials(token);

                // Save the token to the database
                await prisma.googleAuth.create({
                    data: {
                        type: 'token',
                        accessToken: token.access_token ?? null,
                        refreshToken: token.refresh_token ?? null,
                        expiryDate: token.expiry_date ? new Date(token.expiry_date) : null,
                        tokenType: token.token_type ?? null,
                
                        // Ensure these required fields are present
                        clientId: process.env.GOOGLE_CLIENT_ID ?? "your-client-id",
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "your-client-secret",
                        redirectUris: process.env.GOOGLE_REDIRECT_URI ?? "your-redirect-uri",
                    }
                });
                

                info("Token stored to database.");
                resolve(oAuth2Client);
            });
        });
    });
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
        
        info("Sheet names:", sheetNames);

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
    info(`Saving ${totalRows} rows to database`);
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
            info(`Processed ${processed} rows`);
        } catch (error) {
            errors.push(error as Error);
            processed += batch.length;
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