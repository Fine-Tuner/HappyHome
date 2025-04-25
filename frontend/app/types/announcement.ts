export interface Block {
  id: string;
  announcement_id: string;
  page: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  type: string;
  confidence: number;
  model: string;
}

export interface Condition {
  id: string;
  announcement_id: string;
  llm_output_id: string;
  content: string;
  section: string;
  category: string;
  pages: number[];
  created_at: string;
}

export interface ReferenceLink {
  id: string;
  announcement_id: string;
  condition_id: string;
  block_id: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  announcement_id: number;
  announcement_name: string;
  housing_name: string;
  supply_institution_name: string;
  full_address: string;
  total_supply_count: number;
  rent_guarantee: number;
  monthly_rent: number;
  pdf_url: string;
  begin_date: string | null;
  end_date: string | null;
  file_path: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  conditions?: Condition[];
  blocks?: Block[];
  reference_links?: ReferenceLink[];
} 