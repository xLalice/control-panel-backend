import axios from "axios";
import { prisma } from "../../config/prisma";
import { getPostType } from "./utils/getPostType";

export const syncPagePosts = async (
  pageId: string,
  token: string
): Promise<void> => {
  try {
    info(`Starting sync for page: ${pageId}`);
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

    info(
      `Fetched ${postsResponse.data.data.length} posts for page: ${pageId}`
    );

    info(`Post Response: ${postsResponse}`);

    for (const postData of postsResponse.data.data) {
      info(`Processing post: ${postData.id}`);
      await processPost(postData, token);
    }

    info(`Finished syncing posts for page: ${pageId}`);
  } catch (error) {
    console.error("Posts sync error:", error);
    throw error;
  }
};

const processPost = async (postData: any, token: string): Promise<void> => {
  try {
    info(`Fetching insights for post: ${postData.id}`);

    info(
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

    info(`Received insights for post: ${postData.id}`, insights.data);

    // Process insights data
    const metricsData = insights.data.data.reduce((acc: any, insight: any) => {
      acc[insight.name] = insight.values[0].value;
      return acc;
    }, {});

    info(
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

    info(
      "Post Type: ",
      getPostType(postData.attachments)
    ),
      info(`Upserting post: ${postData.id}`);

    const post = await prisma.post.upsert({
      where: { fbPostId: postData.id },
      update: {
        likes: totalLikes,
        comments: postData.comments?.summary?.total_count || 0,
        shares: postData.shares?.count || 0,
        reach: metricsData.post_impressions_unique || 0,
        impressions: metricsData.post_impressions || 0,
        updatedAt: new Date(),
      },
      create: {
        fbPostId: postData.id,
        postType: getPostType(postData.attachments),
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

    info(`Successfully upserted post: ${post.id}`);

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
      info(
        `PostMetric already exists for post: ${
          post.id
        } and date: ${today.toISOString()}`
      );
      return; // Skip saving if PostMetric already exists
    }

    // Store historical metrics
    info(`Creating post metric for post: ${post.id}`);
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

    info(`Successfully stored metrics for post: ${post.id}`);
  } catch (error) {
    console.error(`Post processing error for post: ${postData.id}`, error);
  }
};
