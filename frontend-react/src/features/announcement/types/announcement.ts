export interface Announcement {
  id: string;
  address: string;
  suplyType: string;
  houseType: string;
  targetGroup: string;
  area: number[];
  totalHouseholds: number;
  announcementDate: string; // ISO 날짜 문자열
  announcementName: string;
  applicationStartDate: string; // ISO 날짜 문자열
  applicationEndDate: string; // ISO 날짜 문자열
  moveInDate: string;
  viewCount: number;
}

export interface RentRange {
  min: number;
  max: number;
}

export interface AnnouncementFilter {
  brtcCode?: string;
  signguCode?: string[];
  targetGroup?: string[];
  houseType?: string[];
  suplyType?: string[];
  minArea?: number;
  maxArea?: number;
  yearMtBegin?: string;
  yearMtEnd?: string;
  announcementName?: string;
  page?: number;
  pageSize?: number;
  sort?: SortType;
  rentCodes?: string[];
}

export enum SORT_TYPE {
  LATEST = "latest",
  VIEW = "view",
  DEADLINE = "deadline",
}
export type SortType = (typeof SORT_TYPE)[keyof typeof SORT_TYPE];
