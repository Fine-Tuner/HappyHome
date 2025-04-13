export interface Announcement {
  id: string;
  title: string;
  institution: string;
  announcementDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  status: '모집중' | '모집예정' | '모집종료';
  location: string;
  totalHouseholds: number;
  pdfUrl: string;
  targetGroup: string;
  eligibility: string;
  schedule: string;
  floorArea: string;
  leasePeriod: string;
  buildingType: '아파트' | '오피스텔' | '그 외';
} 