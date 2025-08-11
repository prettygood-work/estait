// Document tools
export { createDocument } from './create-document';
export { updateDocument } from './update-document';
export { requestSuggestions } from './request-suggestions';

// Utility tools
export { getWeather } from './get-weather';

// Wise Agent CRM tools
export {
  createLead,
  addNote,
  searchContacts,
  createTask,
  linkPropertyToContact,
  getTeam,
  generateSSOLink,
} from './wise-agent-tools';

// Export all tools as a collection for easy access
export { createDocument as createDocumentTool } from './create-document';
export { updateDocument as updateDocumentTool } from './update-document';
export { requestSuggestions as requestSuggestionsTool } from './request-suggestions';
export { getWeather as getWeatherTool } from './get-weather';
export {
  createLead as createLeadTool,
  addNote as addNoteTool,
  searchContacts as searchContactsTool,
  createTask as createTaskTool,
  linkPropertyToContact as linkPropertyTool,
  getTeam as getTeamTool,
  generateSSOLink as generateSSOLinkTool,
} from './wise-agent-tools';