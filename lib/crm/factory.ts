import { CRMAdapter } from './interfaces';
import { WiseAgentAdapter } from './adapters/wiseagent';

export type CRMType = 'wise_agent'; // Add more as we implement them

const adapters: Record<CRMType, CRMAdapter> = {
  wise_agent: new WiseAgentAdapter(),
};

export function getCRMAdapter(type: CRMType): CRMAdapter {
  const adapter = adapters[type];
  if (!adapter) {
    throw new Error(`Unknown CRM type: ${type}`);
  }
  return adapter;
}

export function getSupportedCRMs(): Array<{ type: CRMType; name: string }> {
  return Object.entries(adapters).map(([type, adapter]) => ({
    type: type as CRMType,
    name: adapter.name,
  }));
}