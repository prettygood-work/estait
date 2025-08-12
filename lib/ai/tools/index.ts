import { createDocument } from './create-document';
import { updateDocument } from './update-document';
import { requestSuggestions } from './request-suggestions';
import { getWeather } from './get-weather';
import {
  createLead,
  addNote,
  searchContacts,
  createTask,
  linkPropertyToContact,
  getTeam,
  generateSSOLink,
} from './wise-agent-tools';

export const baseTools = {
  createDocument,
  updateDocument,
  requestSuggestions,
  getWeather,
};

export const wiseAgentTools = {
  createLead,
  addNote,
  searchContacts,
  createTask,
  linkPropertyToContact,
  getTeam,
  generateSSOLink,
};

export const allTools = {
  ...baseTools,
  ...wiseAgentTools,
};
