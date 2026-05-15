import api from './api';

export const newsletterService = {
  /**
   * Subscribe to the newsletter
   * @param {string} email 
   * @param {string} firstName 
   * @param {string} segment 
   */
  subscribeToNewsletter: async (email, firstName, segment) => {
    const response = await api.post('newsletter/subscribe/', {
      email,
      first_name: firstName,
      segment
    });
    return response.data;
  },

  /**
   * Get archive of sent issues
   */
  getArchive: async () => {
    const response = await api.get('newsletter/api/archive/');
    return response.data;
  },

  /**
   * Get a single issue by slug
   * @param {string} slug 
   */
  getIssue: async (slug) => {
    const response = await api.get(`newsletter/api/${slug}/`);
    return response.data;
  }
};
