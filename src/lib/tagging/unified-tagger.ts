import type { TaggingInput, GeneratedTag, TaggingResult, TaggingConfig } from './types';
import { DEFAULT_TAGGING_CONFIG } from './types';
import { generateTagsWithOpenAI, generateFallbackTags } from './openai-tagger';
import { generateTagsWithClaude, isClaudeAvailable } from './claude-tagger';

export interface TagAnalysis {
  tags: GeneratedTag[];
  sources: TaggingResult[];
  strategy: string;
  totalProcessingTimeMs: number;
}

export async function generateTags(input: TaggingInput, config: Partial<TaggingConfig> = {}): Promise<TagAnalysis> {
  const cfg = { ...DEFAULT_TAGGING_CONFIG, ...config };
  const startTime = Date.now();
  const sources: TaggingResult[] = [];

  // Try OpenAI first
  if (cfg.providers.includes('openai') && process.env.OPENAI_API_KEY) {
    const result = await generateTagsWithOpenAI(input);
    sources.push(result);
    if (result.success && result.tags.length >= cfg.minTags) {
      return { tags: result.tags.slice(0, cfg.maxTags), sources, strategy: 'openai_only', totalProcessingTimeMs: Date.now() - startTime };
    }
  }

  // Fallback to Claude
  if (cfg.providers.includes('claude') && isClaudeAvailable()) {
    const result = await generateTagsWithClaude(input);
    sources.push(result);
    if (result.success && result.tags.length >= cfg.minTags) {
      return { tags: result.tags.slice(0, cfg.maxTags), sources, strategy: 'claude_only', totalProcessingTimeMs: Date.now() - startTime };
    }
  }

  // Final fallback
  const fallbackTags = generateFallbackTags(input);
  return { tags: fallbackTags, sources, strategy: 'fallback', totalProcessingTimeMs: Date.now() - startTime };
}
