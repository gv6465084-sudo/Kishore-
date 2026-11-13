export type LanguageCode = 'en' | 'ta';

export type AssessmentCategory =
  | 'Verified'
  | 'Contradicted'
  | 'Misleading'
  | 'Suspicious'
  | 'Inconclusive';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type ModuleType = 'news' | 'image' | 'video';

export interface ExplainableIndicators {
  evidence_strength: string;
  source_reliability: string;
  model_confidence: string;
  forensic_anomalies: string;
  verification_status: AssessmentCategory;
}

export interface EvidenceItem {
  title: string;
  publisher: string;
  url: string;
  stance: 'supporting' | 'contradicting' | 'contextual';
  published_date?: string;
  snippet?: string;
  source_type: 'google_fact_check' | 'google_search_grounding' | 'submitted_url' | 'open_web_evidence';
}

export interface NewsClaimItem {
  claim: string;
  status: AssessmentCategory;
  note: string;
}

export interface NewsAnalysisDetails {
  input_mode: 'article' | 'headline' | 'social' | 'url';
  source_url?: string;
  user_evidence_urls?: string[];
  extracted_title?: string;
  original_claim: string;
  extracted_claims: NewsClaimItem[];
  named_entities: string[];
  manipulation_signals: string[];
  unsupported_numbers: string[];
  fact_check_api_status: 'configured' | 'unconfigured' | 'error';
  search_grounding_used: boolean;
}

export interface ImageForensicsDetails {
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  format: string;
  width: number;
  height: number;
  channels?: number;
  color_space?: string;
  bits_per_pixel?: number;
  has_exif: boolean;
  exif_summary: Record<string, string>;
  ela_heatmap_data_url?: string;
  original_preview_data_url?: string;
  ela_stats: {
    mean_difference: number;
    max_difference: number;
    high_variance_ratio: number;
    interpretation_note: string;
  };
  specialised_detector: {
    available: boolean;
    model_name?: string;
    top_label?: string;
    confidence?: number;
    status_message: string;
  };
}

export interface VideoFrameItem {
  timestamp_sec: number;
  timestamp_label: string;
  data_url: string;
}

export interface VideoForensicsDetails {
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  duration_sec: number;
  resolution: string;
  codec: string;
  fps: number;
  has_audio: boolean;
  audio_codec?: string;
  audio_sample_rate?: string;
  contact_sheet_data_url?: string;
  frames: VideoFrameItem[];
  frame_consistency?: {
    compared_pairs: number;
    mean_frame_delta: number;
    max_frame_delta: number;
    summary: string;
  };
  tracks: {
    general_visual_analysis: {
      status: 'completed' | 'local_only' | 'unavailable';
      summary: string;
      findings: string[];
    };
    specialised_deepfake_detection: {
      available: boolean;
      model_name?: string;
      status_message: string;
      findings: string[];
    };
    audio_analysis: {
      status: 'completed' | 'no_audio' | 'unavailable';
      summary: string;
      findings: string[];
    };
    lip_sync_analysis: {
      status: 'limited_visual' | 'unavailable';
      summary: string;
      findings: string[];
    };
  };
}

export interface AnalysisResult {
  analysis_id: string;
  created_at: string;
  language: LanguageCode;
  module: ModuleType;
  title: string;
  assessment: AssessmentCategory;
  confidence: ConfidenceLevel;
  summary: string;
  explanation: string;
  ai_status?: {
    available: boolean;
    mode: 'gemini_free_tier' | 'local_fallback';
    status_message: string;
  };
  indicators: ExplainableIndicators;
  findings: string[];
  evidence: EvidenceItem[];
  next_steps: string[];
  limitations: string[];
  news_details?: NewsAnalysisDetails;
  image_details?: ImageForensicsDetails;
  video_details?: VideoForensicsDetails;
}

export interface HealthResponse {
  status: 'ok';
  free_mode: boolean;
  privacy_mode: 'ephemeral_no_storage';
  capabilities: {
    gemini_configured: boolean;
    fact_check_api_configured: boolean;
    local_forensics_available: boolean;
    ffmpeg_available: boolean;
    serverless?: boolean;
  };
  supported_languages: LanguageCode[];
}
