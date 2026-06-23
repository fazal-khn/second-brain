export interface User {
  id: string;
  email: string;
  full_name: string;
  storage_used_mb: number;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_type: "pdf" | "docx" | "txt";
  file_size_mb: number;
  s3_key: string;
  page_count: number | null;
  word_count: number | null;
  token_count: number | null;
  pinecone_namespace: string | null;
  processing_status: "uploading" | "processing" | "ready" | "failed";
  processing_progress: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  source_chunks: { page: number; text_snippet: string }[] | null;
  created_at: string;
}

export interface ExtractedItem {
  value?: string;
  name?: string;
  place?: string;
  action?: string;
  context?: string;
  currency?: string;
  role?: string;
  type?: string;
  owner?: string;
  deadline?: string;
}

export interface ExtractedData {
  dates: ExtractedItem[];
  monetary_values: ExtractedItem[];
  people: ExtractedItem[];
  organizations: ExtractedItem[];
  statistics: ExtractedItem[];
  locations: ExtractedItem[];
  action_items: ExtractedItem[];
}

export interface TopicInsight {
  topic: string;
  percentage: number;
}

export interface DocumentInsights {
  sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
  };
  reading_level: "Elementary" | "High School" | "Academic";
  keywords: string[];
  topics: TopicInsight[];
  structure_score: number;
  readability_score: number;
  readability_suggestions: string[];
  language: string;
  reading_time_minutes: number;
}

export interface ComparisonResult {
  similarity_score: number;
  common_topics: string[];
  unique_to_doc1: string[];
  unique_to_doc2: string[];
  unique_to_doc3?: string[];
  agreements: { topic: string; description: string }[];
  contradictions: { topic: string; doc1_says: string; doc2_says: string; doc3_says?: string }[];
  more_detailed_on: { topic: string; winner: string; reason: string }[];
  overall_verdict: string;
}

export interface Comparison {
  id: string;
  user_id: string;
  document_ids: string[];
  result: ComparisonResult;
  created_at: string;
}
