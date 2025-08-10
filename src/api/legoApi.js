const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class LegoAPI {
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  }

  async getAllLegos() {
    try {
      const response = await fetch(`${API_BASE_URL}/legos`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch LEGOs:', error);
      throw error;
    }
  }

  async addLego(legoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/legos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(legoData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to add LEGO:', error);
      throw error;
    }
  }

  async updateLego(index, legoData) {
    try {
      const response = await fetch(`${API_BASE_URL}/legos/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(legoData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to update LEGO:', error);
      throw error;
    }
  }

  async deleteLego(index) {
    try {
      const response = await fetch(`${API_BASE_URL}/legos/${index}`, {
        method: 'DELETE',
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to delete LEGO:', error);
      throw error;
    }
  }

  async bulkAddLegos(legosArray) {
    try {
      const response = await fetch(`${API_BASE_URL}/legos/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: legosArray }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to bulk add LEGOs:', error);
      throw error;
    }
  }

  async replaceLegos(legosArray) {
    try {
      const response = await fetch(`${API_BASE_URL}/legos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: legosArray }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to replace LEGOs:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to get status:', error);
      throw error;
    }
  }

  async debugExcel() {
    try {
      const response = await fetch(`${API_BASE_URL}/debug/excel`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to debug Excel:', error);
      throw error;
    }
  }
}

export default new LegoAPI();