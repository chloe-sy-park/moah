import type { ExtractedMetadata } from '@/lib/og-parser';

export interface TaggingInput {
  title: string | null;
  description: string | null;
  platform: string;
  contentType: string;
  creatorName: string | null;
  url: string;
}

export interface GeneratedTag {
  name: string;
  confidence: number;
  category?: string;
}

export interface TaggingResult {
  tags: GeneratedTag[];
  provider: 'openai' | 'claude';
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

export interface TaggingConfig {
  minTags: number;
  maxTags: number;
  minConfidence: number;
  providers: ('openai' | 'claude')[];
  timeout: number;
}

export const DEFAULT_TAGGING_CONFIG: TaggingConfig = {
  minTags: 3,
  maxTags: 5,
  minConfidence: 0.6,
  providers: ['openai'],
  timeout: 10000,
};

export const TAGGING_PROMPT = `Analyze content and generate 3-5 Korean tags.
Title: {title}
Description: {description}
Platform: {platform}
Respond in JSON: {"tags": [{"name": "태그1", "confidence": 0.9, "category": "topic"}]}`;

export function metadataToTaggingInput(metadata: ExtractedMetadata): TaggingInput {
  return {
    title: metadata.title,
    description: metadata.description,
    platform: metadata.platformDisplayName,
    contentType: 'content',
    creatorName: metadata.creatorName,
    url: metadata.normalizedUrl,
  };
}

export function fillPromptTemplate(input: TaggingInput): string {
  return TAGGING_PROMPT
    .replace('{title}', input.title || '')
    .replace('{description}', input.description || '')
    .replace('{platform}', input.platform);
}
