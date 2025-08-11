import { openai } from '@ai-sdk/openai';

export function getOpenAIModel(modelId: string = 'gpt-4-turbo-preview') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your environment variables.');
  }
  
  return openai(modelId);
}

// Export configured models
export const gpt4Turbo = () => getOpenAIModel('gpt-4-turbo-preview');
export const gpt4 = () => getOpenAIModel('gpt-4');
export const gpt35Turbo = () => getOpenAIModel('gpt-3.5-turbo');

// Helper to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}