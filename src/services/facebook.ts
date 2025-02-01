import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { prisma } from "../config/prisma";

dotenv.config();

const TOKEN_PATH = path.resolve(
  __dirname,
  "../../src/credentials/facebook-token.json"
);

interface FacebookCreds {
  user_access_token: string;
  page_access_token: string;
  page_id: string;
  expiry_date: number;
}

// Environment variables validation
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_REDIRECT_URI) {
  throw new Error("Missing Facebook environment variables in .env file");
}

// Required permissions
const SCOPES = [
  "pages_read_engagement",
  "pages_show_list",
  "read_insights",
  "pages_manage_posts",
].join(",");

export const FacebookService = {
  // Authentication
  getAuthUrl: (): string => {
    return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=${SCOPES}`;
  },

  getCurrentCredentials: (): FacebookCreds => {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  },

  handleCallback: async (code: string): Promise<void> => {
    try {
      // Exchange code for tokens
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
      const pageInfo = await FacebookService.getPageAccessToken(
        userAccessToken
      );

      // Store credentials
      const credentials = {
        user_access_token: userAccessToken,
        page_access_token: pageInfo.page_access_token,
        page_id: pageInfo.page_id,
        expiry_date: Date.now() + tokenResponse.data.expires_in * 1000,
      };

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  },

  // Token management
  getValidToken: async (): Promise<string> => {
    try {
      if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error("No stored credentials found");
      }

      const credentials: FacebookCreds = JSON.parse(
        fs.readFileSync(TOKEN_PATH, "utf-8")
      );

      // Refresh token if expired
      if (credentials.expiry_date < Date.now()) {
        const refreshed = await FacebookService.refreshToken(
          credentials.user_access_token
        );
        return refreshed.page_access_token;
      }

      return credentials.page_access_token;
    } catch (error) {
      console.error("Token validation failed:", error);
      throw error;
    }
  },

  refreshToken: async (oldToken: string): Promise<FacebookCreds> => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v22.0/oauth/access_token`,
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            fb_exchange_token: oldToken,
          },
        }
      );

      const newCredentials = {
        ...JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")),
        user_access_token: response.data.access_token,
        expiry_date: Date.now() + response.data.expires_in * 1000,
      };

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newCredentials));
      return newCredentials;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  },

  // Page access
  getPageAccessToken: async (
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
  },

  syncAllData: async (): Promise<void> => {
    try {
      const pageToken = await FacebookService.getValidToken();
      const { page_id: pageId } = await FacebookService.getCurrentCredentials();

      await Promise.all([
        FacebookService.syncPagePosts(pageId, pageToken),
        FacebookService.syncPageMetrics(pageId, pageToken),
      ]);
    } catch (error) {
      console.error("Sync failed: ", error);
      throw error;
    }
  },

  syncPagePosts: async (pageId: string, token: string): Promise<void> => {
    try {
      console.log(`Starting sync for page: ${pageId}`);
      const fields =
        "id,message,attachments{media},created_time,reactions.summary(total_count),comments.summary(total_count),shares.summary(total_count)";

      const postsResponse = await axios.get(
        `https://graph.facebook.com/v22.0/${pageId}/feed`,
        {
          params: {
            access_token: token,
            fields,
          },
        }
      );

      console.log(
        `Fetched ${postsResponse.data.data.length} posts for page: ${pageId}`
      );

      console.log(`Post Response: ${postsResponse}`);

      for (const postData of postsResponse.data.data) {
        console.log(`Processing post: ${postData.id}`);
        await FacebookService.processPost(postData, token);
      }

      console.log(`Finished syncing posts for page: ${pageId}`);
    } catch (error) {
      console.error("Posts sync error:", error);
      throw error;
    }
  },

  processPost: async (postData: any, token: string): Promise<void> => {
    try {
      console.log(`Fetching insights for post: ${postData.id}`);

      console.log(
        `Attachments for post ${postData.id}:`,
        postData.attachments.data
      );

      // Fetch insights for the post
      const insights = await axios.get(
        `https://graph.facebook.com/v22.0/${postData.id}/insights`,
        {
          params: {
            access_token: token,
            metric:
              "post_impressions,post_impressions_unique,post_reactions_by_type_total",
          },
        }
      );

      console.log(`Received insights for post: ${postData.id}`, insights.data);

      // Process insights data
      const metricsData = insights.data.data.reduce(
        (acc: any, insight: any) => {
          acc[insight.name] = insight.values[0].value;
          return acc;
        },
        {}
      );

      console.log(
        `post_reactions_by_type_total for post ${postData.id}:`,
        metricsData.post_reactions_by_type_total
      );

      // Calculate total likes from post_reactions_by_type_total
      const reactions = metricsData.post_reactions_by_type_total || {};
      const totalLikes =
        (reactions.like || 0) +
        (reactions.love || 0) +
        (reactions.wow || 0) +
        (reactions.haha || 0) +
        (reactions.sad || 0) +
        (reactions.angry || 0);

        console.log("Post Type: ", FacebookService.getPostType(postData.attachments)),

      console.log(`Upserting post: ${postData.id}`);

      // Upsert post data using insights for likes
      const post = await prisma.post.upsert({
        where: { fbPostId: postData.id },
        update: {
          likes: totalLikes, // Use insights data for likes
          comments: postData.comments?.summary?.total_count || 0,
          shares: postData.shares?.count || 0,
          reach: metricsData.post_impressions_unique || 0,
          impressions: metricsData.post_impressions || 0,
          updatedAt: new Date(),
        },
        create: {
          fbPostId: postData.id,
          postType: FacebookService.getPostType(postData.attachments),
          content: postData.message || "",
          mediaUrl: postData.attachments?.data?.[0]?.media?.image?.src || null,
          likes: totalLikes, // Use insights data for likes
          comments: postData.comments?.summary?.total_count || 0,
          shares: postData.shares?.count || 0,
          reach: metricsData.post_impressions_unique || 0,
          impressions: metricsData.post_impressions || 0,
          createdAt: new Date(postData.created_time),
        },
      });

      console.log(`Successfully upserted post: ${post.id}`);

      // Check if PostMetric already exists for this post and date
      const today = new Date();
      const existingPostMetric = await prisma.postMetric.findFirst({
        where: {
          postId: post.id,
          fetchedAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)), // Start of the day
            lt: new Date(today.setHours(23, 59, 59, 999)), // End of the day
          },
        },
      });

      if (existingPostMetric) {
        console.log(
          `PostMetric already exists for post: ${
            post.id
          } and date: ${today.toISOString()}`
        );
        return; // Skip saving if PostMetric already exists
      }

      // Store historical metrics
      console.log(`Creating post metric for post: ${post.id}`);
      await prisma.postMetric.create({
        data: {
          postId: post.id,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          reach: post.reach,
          impressions: post.impressions,
        },
      });

      console.log(`Successfully stored metrics for post: ${post.id}`);
    } catch (error) {
      console.error(`Post processing error for post: ${postData.id}`, error);
    }
  },

  syncPageMetrics: async (pageId: string, token: string): Promise<void> => {
    try {
      console.log("Fetching page metrics");
      const now = new Date();
      console.log("Current server time:", now.toISOString());

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      if (yesterday > now) {
        throw new Error("Invalid system clock - detected future date");
      }

      const dayBeforeYesterday = new Date(yesterday);
      dayBeforeYesterday.setDate(yesterday.getDate() - 1);

      const yesterdayDate = yesterday.toISOString().split("T")[0];
      const dayBeforeYesterdayDate = dayBeforeYesterday
        .toISOString()
        .split("T")[0];

      console.log(
        "Using date range:",
        dayBeforeYesterdayDate,
        "to",
        yesterdayDate
      );

      // Check if metrics already exist for this date
      const existingMetric = await prisma.pageMetric.findFirst({
        where: {
          date: {
            gte: new Date(yesterdayDate), // Start of the day
            lt: new Date(
              new Date(yesterdayDate).setDate(yesterday.getDate() + 1)
            ), // End of the day
          },
        },
      });

      if (existingMetric) {
        console.log("Metrics already exist for date:", yesterdayDate);
        return; // Skip saving if metrics already exist
      }

      // Fetch posts for engagement calculation
      const postsResponse = await axios.get(
        `https://graph.facebook.com/v22.0/${pageId}/posts`,
        {
          params: {
            access_token: token,
            fields:
              "reactions.summary(total_count),comments.summary(total_count),shares.summary(total_count)",
            since: dayBeforeYesterdayDate,
            until: yesterdayDate,
          },
        }
      );

      const engagement = postsResponse.data.data.reduce(
        (sum: number, post: any) => {
          return (
            sum +
            (post.reactions?.summary?.total_count || 0) +
            (post.comments?.summary?.total_count || 0) +
            (post.shares?.summary?.total_count || 0)
          );
        },
        0
      );

      // Fetch insights for page metrics
      const insights = await axios.get(
        `https://graph.facebook.com/v22.0/${pageId}/insights`,
        {
          params: {
            access_token: token,
            metric:
              "page_fans,page_views_total,page_impressions,page_impressions_unique",
            period: "day",
            date_preset: "yesterday",
          },
        }
      );

      const metrics = insights.data.data.reduce((acc: any, insight: any) => {
        acc[insight.name] = insight.values[0].value;
        return acc;
      }, {});

      // Save metrics if they don't already exist
      await prisma.pageMetric.create({
        data: {
          date: yesterday,
          engagement,
          followerCount: metrics.page_fans || 0,
          pageViews: metrics.page_views_total || 0,
          pageImpressions: metrics.page_impressions || 0,
          pageReach: metrics.page_impressions_unique || 0,
        },
      });

      console.log("Successfully saved metrics for date:", yesterdayDate);
    } catch (error) {
      console.error("Page metrics sync error:", error);
      throw error;
    }
  },

  getPostType: (attachments: any): string => {
    if (!attachments?.data?.[0]) return "text";

    const attachment = attachments.data[0];
    const media = attachment.media;

    if (!media) return "text";

    // If media has source property, it's a video/reel
    if (media.source) {
      return "video/reel";
    }

    // If there's only an image property, it's a photo post
    if (media.image) {
      return "image";
    }

    // Default to text if no specific media type is found
    return "text";
  },

  async fetchAndStoreDailyMetrics(): Promise<void> {
    try {
      const { page_id: pageId, page_access_token: token } =
        FacebookService.getCurrentCredentials();

      // Get yesterday's metrics (more accurate than real-time)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split("T")[0];

      // Check if we already have metrics for this date
      const existing = await prisma.pageMetric.findUnique({
        where: { date: yesterday },
      });

      if (!existing) {
        const metrics = await this.fetchDailyMetrics(pageId, token);
        await this.storeMetrics(metrics, yesterday);
      }
    } catch (error) {
      console.error("Page metrics sync error:", error);
      throw error;
    }
  },

  async fetchDailyMetrics(pageId: string, token: string) {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      console.log("Fetching metrics for:", yesterdayDate);

      if (yesterday > new Date()) {
        throw new Error("Invalid date parameters - cannot use future dates");
      }

      const [insights, posts] = await Promise.all([
        axios.get(`https://graph.facebook.com/v22.0/${pageId}/insights`, {
          params: {
            access_token: token,
            metric:
              "page_fans,page_views_total,page_impressions,page_impressions_unique",
            period: "day",
            date_preset: "yesterday",
          },
        }),
        axios.get(`https://graph.facebook.com/v22.0/${pageId}/posts`, {
          params: {
            access_token: token,
            fields:
              "likes.summary(total_count),comments.summary(total_count),shares.summary(total_count)",
            since: yesterdayDate,
            until: yesterdayDate,
          },
        }),
      ]);

      // Calculate total engagement from posts
      const totalEngagement = posts.data.data.reduce(
        (sum: number, post: any) => {
          return (
            sum +
            (post.likes?.summary?.total_count || 0) +
            (post.comments?.summary?.total_count || 0) +
            (post.shares?.summary?.total_count || 0)
          );
        },
        0
      );

      // Process insights
      const metrics = insights.data.data.reduce((acc: any, insight: any) => {
        acc[insight.name] = insight.values[0].value;
        return acc;
      }, {});

      return {
        followerCount: metrics.page_fans || 0,
        pageViews: metrics.page_views_total || 0,
        pageImpressions: metrics.page_impressions || 0,
        pageReach: metrics.page_impressions_unique || 0,
        engagement: totalEngagement,
      };
    } catch (error) {
      console.error("Failed to fetch daily metrics:", error);
      throw error;
    }
  },

  async storeMetrics(metrics: any, date: Date) {
    return prisma.pageMetric.create({
      data: {
        date,
        followerCount: metrics.followerCount || 0,
        pageViews: metrics.pageViews || 0, // Add this field
        pageImpressions: metrics.pageImpressions || 0,
        pageReach: metrics.pageReach || 0,
        engagement: metrics.engagement || 0,
      },
    });
  },

  async getHistoricalData(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.pageMetric.findMany({
      where: {
        date: {
          gte: startDate,
          lte: new Date(),
        },
      },
      orderBy: { date: "asc" },
    });
  },
};
