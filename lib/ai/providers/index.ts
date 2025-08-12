import { getOpenAIModel } from './openai-provider';
import { myProvider } from '@/lib/ai/providers';

// ...existing code...

export function getAIProvider(modelId?: string) {
  if (process.env.OPENAI_API_KEY) {
    return getOpenAIModel(modelId || 'gpt-4o-mini');
  }
  // ...existing fallback logic (e.g., xAI or others)...
  throw new Error('No AI provider configured');
}

// Non-breaking: keep existing myProvider export untouched
export { myProvider };
