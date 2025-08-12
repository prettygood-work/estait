import { openai } from '@ai-sdk/openai';

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function assertKey() {
  if (!isOpenAIConfigured()) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
}

export function getOpenAIModel(modelId = 'gpt-4o-mini') {
  assertKey();
  return openai(modelId);
}

export const models = {
  gpt4oMini: () => getOpenAIModel('gpt-4o-mini'),
  gpt4Turbo: () => getOpenAIModel('gpt-4.1-mini'),
  gpt35Turbo: () => getOpenAIModel('gpt-3.5-turbo'),
};
};
