import api from './api';

export const projectService = {
  // Get all user projects
  getProjects: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  // Get single project
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  // Save as draft (Create or Update)
  saveDraft: async (id, data) => {
    if (id) {
      // Update existing draft
      const response = await api.patch(`/projects/${id}/`, data);
      return response.data;
    } else {
      // Create new draft
      const response = await api.post('/projects/', data);
      return response.data;
    }
  },

  // Submit project (moves from draft to submitted)
  submitProject: async (id) => {
    const response = await api.post(`/projects/${id}/submit/`);
    return response.data;
  },

  // Upload a file for a project
  uploadFile: async (projectId, file, category) => {
    const formData = new FormData();
    formData.append('project', projectId);
    formData.append('file', file);
    formData.append('category', category);

    const response = await api.post('/project-files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Trigger score calculation
  calculateScore: async (id) => {
      const response = await api.post(`/projects/${id}/calculate_score/`);
      return response.data;
  }
};
