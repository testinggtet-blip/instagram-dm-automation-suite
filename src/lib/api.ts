/**
 * API Client for Instagram DM Automation Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getAuthUrl(): Promise<{ auth_url: string }> {
    return this.request('/api/auth/login');
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  // Instagram endpoints
  async getAvailableInstagramAccounts() {
    return this.request('/api/instagram/accounts');
  }

  async connectInstagramAccount(accountData: any) {
    return this.request('/api/instagram/connect', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async getConnectedAccounts() {
    return this.request('/api/instagram/connected-accounts');
  }

  async getConversations(accountId: number) {
    return this.request(`/api/instagram/accounts/${accountId}/conversations`);
  }

  async getMessages(conversationId: number) {
    return this.request(`/api/instagram/conversations/${conversationId}/messages`);
  }

  async sendMessage(accountId: number, data: { recipient_id: string; message_text: string; conversation_id?: number }) {
    return this.request(`/api/instagram/send-message?account_id=${accountId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disconnectAccount(accountId: number) {
    return this.request(`/api/instagram/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Automation endpoints
  async createAutomationRule(accountId: number, ruleData: any) {
    return this.request(`/api/automation/rules?account_id=${accountId}`, {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async getAutomationRules(accountId: number) {
    return this.request(`/api/automation/rules?account_id=${accountId}`);
  }

  async getAutomationRule(ruleId: number) {
    return this.request(`/api/automation/rules/${ruleId}`);
  }

  async updateAutomationRule(ruleId: number, ruleData: any) {
    return this.request(`/api/automation/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteAutomationRule(ruleId: number) {
    return this.request(`/api/automation/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async toggleAutomationRule(ruleId: number) {
    return this.request(`/api/automation/rules/${ruleId}/toggle`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
