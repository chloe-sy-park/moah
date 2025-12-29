import Anthropic from '@anthropic-ai/sdk';
import type { TaggingInput, TaggingResult, GeneratedTag } from './types';
import { fillPromptTemplate } from './types';

let claudeClient: Anthropic | null = null;

export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return claudeClient;
}

export async function generateTagsWithClaude(input: TaggingInput): Promise<TaggingResult> {
  const startTime = Date.now();
  try {
    if (!isClaudeAvailable()) throw new Error('Claude not available');
    const client = getClaudeClient();
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: fillPromptTemplate(input) }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Not text response');

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) as GeneratedTag[] : [];

    return { tags, provider: 'claude', processingTimeMs: Date.now() - startTime, success: true };
  } catch (error) {
    return { tags: [], provider: 'claude', processingTimeMs: Date.now() - startTime, success: false, error: String(error) };
  }
}
