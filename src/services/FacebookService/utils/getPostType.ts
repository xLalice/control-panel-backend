export const getPostType = (attachments: any): string => {
  if (!attachments?.data?.[0]) return "text";

  const attachment = attachments.data[0];
  const media = attachment.media;

  if (!media) return "text";

  if (media.source) {
    return "video/reel";
  }

  if (media.image) {
    return "image";
  }

  return "text";
};
