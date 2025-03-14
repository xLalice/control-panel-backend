import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getValidToken } from "../services/FacebookService/token-management";
import { getAuthUrl, handleCallback, getCurrentCredentials } from "../services/FacebookService/auth";
import { syncPagePosts } from "../services/FacebookService/posts";
import { syncPageMetrics, getHistoricalData } from "../services/FacebookService/metrics";
import { info } from "../utils/logger";



const router = express.Router();


router.get("/auth/facebook", async (req: Request, res: Response): Promise<any> => {
  try {
    const token = await getValidToken();
    if (token) {
      return res.json({ authenticated: true, token });
    }
    
    res.redirect(getAuthUrl());
  } catch (error) {
    console.error("Auth init error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.get("/auth/facebook/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) throw new Error("Missing authorization code");
    
    await handleCallback(code as string);
    res.redirect("/dashboard"); // Redirect to frontend dashboard
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.post("/sync/all", async (req, res): Promise<any> => {
  try {
    // Get credentials first
    const credentials = await getCurrentCredentials();
    if (!credentials) {
      return res.status(401).json({ error: "Not authenticated with Facebook" });
    }

    // Run sync operations sequentially
    await syncPagePosts(
      credentials.page_id,
      credentials.page_access_token
    );
    
    await syncPageMetrics(
      credentials.page_id,
      credentials.page_access_token
    );

    res.json({
      success: true,
      message: "Successfully synced posts and page metrics"
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to complete sync",
      details: error.message
    });
  }
});

router.get('/facebook/overview', async (req, res) => {
  try {
    const { days = 365 } = req.query;
    
    const [posts, pageMetrics, historicalMetrics] = await Promise.all([
      prisma.post.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          metrics: {
            orderBy: { fetchedAt: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.pageMetric.findMany({
        where: {
          fetchedAt: {
            gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { fetchedAt: 'asc' },
      }),
      getHistoricalData(Number(days))
    ]);

    const response = {
      posts: posts.map(post => ({
        ...post,
        engagementRate: ((post.likes + post.comments + post.shares) / post.reach) * 100 || 0,
        metrics: post.metrics
      })),
      pageMetrics,
      historicalMetrics: historicalMetrics.map(metric => ({
        date: metric.date.toISOString(),
        engagementRate: metric.pageReach > 0 
          ? (metric.engagement / metric.pageReach) * 100 
          : 0,
        followerCount: metric.followerCount,
        impressions: metric.pageImpressions
      }))
    };

    info('Fetched overview data');

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;