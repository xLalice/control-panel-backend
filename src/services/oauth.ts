import fs from "fs";
import { google, Auth } from "googleapis";

const CREDENTIALS_PATH = "./src/credentials/google-credentials.json";
const TOKEN_PATH = "./src/credentials/google-token.json";

async function authenticate(): Promise<Auth.OAuth2Client> {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));

    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
        oAuth2Client.setCredentials(token);

        // Check if access token is expired and refresh if necessary
        if (token.expiry_date && token.expiry_date < Date.now()) {
            console.log("Access token expired. Refreshing...");
            const refreshedToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(refreshedToken.credentials);

            // Save the refreshed token to the file
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(oAuth2Client.credentials));
            console.log("Access token refreshed and saved.");
        } else {
            console.log("Token is still valid.");
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

    console.log("Authorize this app by visiting this URL:", authUrl);

    return new Promise((resolve, reject) => {
        const rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Enter the code from that page here: ", (code: string) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error("Error retrieving access token:", err);
                    reject(err);
                    return;
                }
                oAuth2Client.setCredentials(token as Auth.Credentials);

                // Save the token to disk
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                console.log("Token stored to", TOKEN_PATH);
                resolve(oAuth2Client);
            });
        });
    });
}

export default authenticate;
