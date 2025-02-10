import { FacebookCreds } from "@prisma/client";
import { getCurrentCredentials } from "./auth";
import {
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_REDIRECT_URI,
} from "../../utils/config";
import axios from "axios";
import { prisma } from "../../config/prisma";

export const getValidToken = async (): Promise<string> => {
  try {
    const credentials: FacebookCreds | null = await getCurrentCredentials();

    if (!credentials) {
      throw new Error("No credentials found");
    }

    if (credentials.expiry_date.getTime() < Date.now()) {
      const refreshed = await refreshToken(credentials);
      return refreshed.page_access_token;
    }

    return credentials.page_access_token;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
};

export const refreshToken = async (
  credentials: FacebookCreds
): Promise<FacebookCreds> => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/oauth/access_token`,
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          fb_exchange_token: credentials.user_access_token,
        },
      }
    );

    const result = await prisma.facebookCreds.upsert({
      where: { user_access_token: credentials.user_access_token },
      update: {
        page_access_token: response.data.access_token,
        expiry_date: new Date(Date.now() + response.data.expires_in * 1000),
      },
      create: {
        user_access_token: response.data.access_token,
        page_access_token: response.data.access_token,
        page_id: credentials.page_id,
        expiry_date: new Date(Date.now() + response.data.expires_in * 1000),
      },
    });

    return result;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

export const getPageAccessToken = async (
  userToken: string
): Promise<{ page_id: string; page_access_token: string }> => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/me/accounts`,
      {
        params: { access_token: userToken },
      }
    );

    const page = response.data.data.find(
      (p: any) => p.tasks.includes("ANALYZE") || p.tasks.includes("ADVERTISE")
    );

    if (!page) throw new Error("No eligible Page found");

    return {
      page_id: page.id,
      page_access_token: page.access_token,
    };
  } catch (error) {
    console.error("Page access failed:", error);
    throw error;
  }
};
