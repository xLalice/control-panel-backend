import { getCurrentCredentials } from "./auth";
import { syncPagePosts } from "./posts";
import { syncPageMetrics } from "./metrics";

export const syncAllData = async (): Promise<void> => {
  try {
    const credentials = await getCurrentCredentials();
    if (!credentials) {
      throw new Error("No credentials found.");
    }
    const { page_id: pageId, page_access_token: pageToken } = credentials;


    await Promise.all([
      syncPagePosts(pageId, pageToken),
      syncPageMetrics(pageId, pageToken),
    ]);
  } catch (error) {
    console.error("Sync failed: ", error);
    throw error;
  }
};
