import api from './api';

export const contactService = {
  /**
   * Submit a contact inquiry
   * @param {Object} data - { first_name, last_name, email, company, source, notes }
   */
  submitInquiry: async (data) => {
    // Add trailing slash for Django
    const response = await api.post('contact/', data);
    return response.data;
  }
};
