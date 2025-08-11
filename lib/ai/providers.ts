import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
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
import { isOpenAIConfigured } from './providers/openai-provider';

// Helper function to get the appropriate AI provider
function getAIProvider() {
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
  } else {
    throw new Error('No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY in your environment variables.');
  }
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : getAIProvider();
