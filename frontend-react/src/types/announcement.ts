export interface Announcement {
  id: string;
  name: string;
  address: string;
  announcementDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  moveInDate: string;
  totalHouseholds: number;
  remainingHouseholds: number;
  conditions: string[];
  pdfUrl: string;
} 