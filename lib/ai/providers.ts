import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1Provider,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// Inline replacement for isOpenAIConfigured to avoid importing the broken file
function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Helper function to get the appropriate AI provider
function getAIProvider(): LanguageModelV1Provider {
  if (isOpenAIConfigured()) {
    return customProvider({
      languageModels: {
        'chat-model': openai('gpt-4-turbo-preview'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4-turbo-preview'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-3.5-turbo'),
        'artifact-model': openai('gpt-4-turbo-preview'),
      },
    });
  } else if (process.env.XAI_API_KEY) {
    return customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
  }
  throw new Error(
    'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY in your environment variables.',
  );
}

// Lazily create provider to avoid build-time errors in certain environments
let _provider: LanguageModelV1Provider | null = null;

export function resolveProvider(): LanguageModelV1Provider {
  if (_provider) return _provider;
  _provider = isTestEnvironment
    ? customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      })
    : getAIProvider();
  return _provider;
}

// Backwards-compatible export
export const myProvider = resolveProvider();
export type { LanguageModelV1Provider };
