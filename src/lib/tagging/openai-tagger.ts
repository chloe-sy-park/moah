import OpenAI from 'openai';
import type { TaggingInput, TaggingResult, GeneratedTag } from './types';
import { fillPromptTemplate } from './types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiClient;
}

export async function generateTagsWithOpenAI(input: TaggingInput): Promise<TaggingResult> {
  const startTime = Date.now();
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a content tagging expert. Respond in valid JSON.' },
        { role: 'user', content: fillPromptTemplate(input) },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content);
    const tags = parseTagsFromResponse(parsed);

    return { tags, provider: 'openai', processingTimeMs: Date.now() - startTime, success: true };
  } catch (error) {
    return { tags: [], provider: 'openai', processingTimeMs: Date.now() - startTime, success: false, error: String(error) };
  }
}

function parseTagsFromResponse(response: unknown): GeneratedTag[] {
  if (!response || typeof response !== 'object') return [];
  const r = response as Record<string, unknown>;
  const tags = r.tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is GeneratedTag => t && typeof t === 'object' && 'name' in t).slice(0, 5);
}

export function generateFallbackTags(input: TaggingInput): GeneratedTag[] {
  const tags: GeneratedTag[] = [];
  if (input.platform) tags.push({ name: input.platform, confidence: 0.7, category: 'platform' });
  return tags;
}
