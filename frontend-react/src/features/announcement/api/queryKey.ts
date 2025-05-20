import { GetAnnouncementParams } from "./getAnnouncement";
import { GetAnnouncementsParams } from "./getAnnouncements";

const queryKeys = {
  list: (params?: GetAnnouncementsParams) => ["list", params],
  detail: (id?: string) => ["detail", id],
};

export default queryKeys;
