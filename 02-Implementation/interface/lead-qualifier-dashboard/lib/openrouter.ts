import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenRouter(): OpenAI {
  return (client ??= new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultHeaders: {
      'HTTP-Referer': 'https://flinty.kamesai.com',
    },
  }));
}

export const CLAUDE_OPUS = 'anthropic/claude-opus-4-6';
