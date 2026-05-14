import api from './api';

export const validatorService = {
  getQuota: async () => {
    const response = await api.get('/idea-validator/quota/');
    return response.data;
  },

  getQuestions: async () => {
    const response = await api.get('/idea-validator/sessions/questions/');
    return response.data;
  },

  listSessions: async () => {
    const response = await api.get('/idea-validator/sessions/');
    return response.data;
  },

  getSession: async (id) => {
    const response = await api.get(`/idea-validator/sessions/${id}/`);
    return response.data;
  },

  createSession: async () => {
    const response = await api.post('/idea-validator/sessions/');
    return response.data;
  },

  saveStep: async (id, stepNumber, answers) => {
    const response = await api.post(`/idea-validator/sessions/${id}/save-step/`, {
      step_number: stepNumber,
      answers: answers
    });
    return response.data;
  },

  submitSession: async (id) => {
    const response = await api.post(`/idea-validator/sessions/${id}/submit/`);
    return response.data;
  },

  pollStatus: async (id) => {
    const response = await api.get(`/idea-validator/sessions/${id}/poll_status/`);
    return response.data;
  },

  getPolishedReport: async (id) => {
    const response = await api.get(`/idea-validator/sessions/${id}/polished-report/`);
    return response.data;
  }
};
