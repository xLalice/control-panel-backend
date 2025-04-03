import axios from "axios";
import { prisma } from "../../config/prisma";
import { getCurrentCredentials } from "../FacebookService/auth";

export const fetchAndStoreDailyMetrics = async (): Promise<void> => {
  try {
    const credentials = await getCurrentCredentials();
    if (!credentials || !credentials.page_id || !credentials.page_access_token) {
      throw new Error("No valid Facebook credentials found.");
    }
    const pageId: string = credentials.page_id;
    const token: string = credentials.page_access_token;

    // Calculate yesterday's date normalized to the start of the day.
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    // Define a date range for yesterday.
    const startOfYesterday = new Date(yesterday);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Check if metrics for yesterday already exist.
    const existingMetric = await prisma.pageMetric.findFirst({
      where: {
        date: {
          gte: startOfYesterday,
          lt: endOfYesterday,
        },
      },
    });

    if (!existingMetric) {
      const metrics = await fetchDailyMetrics(pageId, token);
      await storeMetrics(metrics, yesterday);
      console.log("Daily metrics stored successfully for", yesterday.toISOString());
    } else {
      console.log("Daily metrics already exist for", yesterday.toISOString());
    }
  } catch (error) {
    console.error("Page metrics sync error:", error);
    throw error;
  }
};

export const fetchDailyMetrics = async (
  pageId: string,
  token: string
): Promise<{
  followerCount: number;
  pageViews: number;
  pageImpressions: number;
  pageReach: number;
  engagement: number;
}> => {
  try {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    console.log("Fetching metrics for:", yesterdayDate);

    if (yesterday > new Date()) {
      throw new Error("Invalid date parameters - cannot use future dates");
    }

    const [insightsResponse, postsResponse] = await Promise.all([
      axios.get(`https://graph.facebook.com/v22.0/${pageId}/insights`, {
        params: {
          access_token: token,
          metric: "page_fans,page_views_total,page_impressions,page_impressions_unique",
          period: "day",
          date_preset: "yesterday",
        },
      }),
      axios.get(`https://graph.facebook.com/v22.0/${pageId}/posts`, {
        params: {
          access_token: token,
          fields: "likes.summary(total_count),comments.summary(total_count),shares.summary(total_count)",
          since: yesterdayDate,
          until: yesterdayDate,
        },
      }),
    ]);

    // Calculate total engagement from posts.
    const totalEngagement: number = postsResponse.data.data.reduce(
      (sum: number, post: any) =>
        sum +
        (post.likes?.summary?.total_count || 0) +
        (post.comments?.summary?.total_count || 0) +
        (post.shares?.summary?.total_count || 0),
      0
    );

    // Process insights data.
    const metrics = insightsResponse.data.data.reduce((acc: any, insight: any) => {
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
};

export const storeMetrics = async (
  metrics: { followerCount: number; pageViews: number; pageImpressions: number; pageReach: number; engagement: number },
  date: Date
): Promise<void> => {
  try {
    await prisma.pageMetric.create({
      data: {
        date,
        followerCount: metrics.followerCount,
        pageViews: metrics.pageViews,
        pageImpressions: metrics.pageImpressions,
        pageReach: metrics.pageReach,
        engagement: metrics.engagement,
      },
    });
    console.log("Metrics stored for date:", date.toISOString());
  } catch (error) {
    console.error("Failed to store metrics:", error);
    throw error;
  }
};

export const getHistoricalData = async (days: number): Promise<any[]> => {
  try {
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
  } catch (error) {
    console.error("Failed to fetch historical data:", error);
    throw error;
  }
};


