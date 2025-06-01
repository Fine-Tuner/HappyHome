export interface ZoteroAnnotation {
  id: string;
  type: string;
  text: string;
  color: string;
  contentId?: string;
  categoryId?: string;
  categoryName?: string;
  contentTitle?: string;
  extractedText?: string;
  shouldUpdateContent?: boolean;
  conditionId?: string;
  comment: string;
  authorName: string;
  isAuthorNameAuthoritative: boolean;
  dateCreated: string;
  dateModified: string;
  pageLabel: string;
  position: {
    pageIndex: number;
    rects: number[][];
  };
  sortIndex: string;
  tags: string[];
}
