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
  color?: string;
}

export interface AnalysisResult {
  id: string;
  topic: string;
  contents: ContentItem[];
}

export interface ContextMenuParams {
  x: number;
  y: number;
  items: Array<{
    id: string;
    label: string;
    enabled: boolean;
  }>;
}

export interface Annotation {
  id: string;
  type: string;
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
  sortIndex: number;
}

export interface ViewState {
  pageIndex: number;
  scale: number | string;
  scrollLeft: number;
  scrollTop: number;
}

export interface CustomTheme {
  id: string;
  name: string;
  styles: Record<string, string>;
}

export interface PdfView {
  _tool: any;
  _pdfPages: Record<number, any>;
  _onAddAnnotation: (annotation: any) => void;
}

export interface ZoteroReader {
  _tools: any;
  _primaryView: any;
  openContextMenu: (params: ContextMenuParams) => void;
  setSelectedAnnotations: (ids: string[]) => void;
}

export interface ZoteroWindow extends Window {
  createReader: (options: any) => ZoteroReader;
}

export interface SelectedContent {
  id: string;
  title: string;
  content: string;
}
