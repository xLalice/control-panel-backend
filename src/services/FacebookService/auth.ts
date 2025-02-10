import { prisma } from "../../config/prisma";
import { FacebookCreds } from "@prisma/client";
import axios from "axios";
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_REDIRECT_URI,
} from "../../utils/config";
import { getPageAccessToken } from "./token-management";
import { SCOPES } from "./config";

export const getAuthUrl = (): string => {
  return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=${SCOPES}`;
};

export const getCurrentCredentials =
  async (): Promise<FacebookCreds | null> => {
    return await prisma.facebookCreds.findFirst();
  };

export const handleCallback = async (code: string): Promise<void> => {
  try {
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v22.0/oauth/access_token`,
      {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: FACEBOOK_REDIRECT_URI,
          code,
        },
      }
    );

    const userAccessToken = tokenResponse.data.access_token;

    // Get page access token
    const pageInfo = await getPageAccessToken(userAccessToken);

    // Store credentials
    const credentials = {
      user_access_token: userAccessToken,
      page_access_token: pageInfo.page_access_token,
      page_id: pageInfo.page_id,
      expiry_date: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    };

    await prisma.facebookCreds.upsert({
      where: { user_access_token: userAccessToken },
      update: credentials,
      create: credentials,
    });
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
}
