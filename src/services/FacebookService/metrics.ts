import { prisma } from "../../config/prisma";
import axios from "axios";
import { getCurrentCredentials } from "./auth";

export const syncPageMetrics = async (
  pageId: string,
  token: string
): Promise<void> => {
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
};

export const fetchAndStoreDailyMetrics = async (): Promise<void> => {
  try {
    const credentials = await getCurrentCredentials();
    if (!credentials) {
      throw new Error("No credentials found.");
    }
    const { page_id: pageId, page_access_token: token } = credentials;

    // Get yesterday's metrics (more accurate than real-time)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split("T")[0];

    // Check if we already have metrics for this date
    const existing = await prisma.pageMetric.findUnique({
      where: { date: yesterday },
    });

    if (!existing) {
      const metrics = await fetchDailyMetrics(pageId, token);
      await storeMetrics(metrics, yesterday);
    }
  } catch (error) {
    console.error("Page metrics sync error:", error);
    throw error;
  }
};

export const fetchDailyMetrics = async (pageId: string, token: string) => {
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
    const totalEngagement = posts.data.data.reduce((sum: number, post: any) => {
      return (
        sum +
        (post.likes?.summary?.total_count || 0) +
        (post.comments?.summary?.total_count || 0) +
        (post.shares?.summary?.total_count || 0)
      );
    }, 0);

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
};

export const storeMetrics = async (metrics: any, date: Date) => {
  return await prisma.pageMetric.create({
    data: {
      date,
      followerCount: metrics.followerCount || 0,
      pageViews: metrics.pageViews || 0, // Add this field
      pageImpressions: metrics.pageImpressions || 0,
      pageReach: metrics.pageReach || 0,
      engagement: metrics.engagement || 0,
    },
  });
};

export const getHistoricalData = async (days: number) => {
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
};
