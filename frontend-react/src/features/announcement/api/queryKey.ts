import { GetAnnouncementParams } from "./get/announcement";
import { GetAnnouncementsParams } from "./get/announcements";

const queryKeys = {
  all: ["announcements"],
  list: (params?: GetAnnouncementsParams) => [...queryKeys.all, "list", params],
  detail: (params?: GetAnnouncementParams) => [
    ...queryKeys.all,
    "detail",
    params,
  ],
};

export default queryKeys;
