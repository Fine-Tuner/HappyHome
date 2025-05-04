export interface Announcement {
  sn: number;
  announcementName: string;
  address: string;
  targetGroup: string[];
  houseType: string[];
  area: number[];
  announcementDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  moveInDate: string;
  totalHouseholds: number;
  suplyType: string;
  viewCount: number;
}

export interface RentRange {
  min: number;
  max: number;
}

export interface AnnouncementFilter {
  brtcCode?: string;
  signguCode?: string;
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
  sort?: string;
} 