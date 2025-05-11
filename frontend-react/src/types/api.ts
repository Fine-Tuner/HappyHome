// export interface Announcement {
//   id: string;
//   name: string;
//   address: string;
//   announcementDate: string;
//   applicationStartDate: string;
//   applicationEndDate: string;
//   moveInDate: string;
//   totalHouseholds: number;
//   remainingHouseholds: number;
//   conditions: string[];
//   pdfUrl: string;
// }

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface ContentItem {
  content: string;
  bbox: BBox;
  comments: Comment[];
}

export interface AnalysisResult {
  id: string;
  topic: string;
  contents: ContentItem[];
}

export interface AddCommentRequest {
  contentId: string;
  content: string;
  author: string;
}

export interface UpdateContentRequest {
  content: string;
}
