const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "An error occurred",
      }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async getFacebookLoginUrl() {
    return this.request<{ auth_url: string }>("/api/auth/login");
  }

  async getCurrentUser() {
    return this.request<any>("/api/auth/me");
  }

  async logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  }

  // Instagram endpoints
  async getInstagramAccounts() {
    return this.request<any[]>("/api/instagram/accounts");
  }

  async connectInstagramAccount() {
    return this.request<any>("/api/instagram/connect", { method: "POST" });
  }

  async getConversations(accountId: number) {
    return this.request<any[]>(
      `/api/instagram/accounts/${accountId}/conversations`
    );
  }

  async getMessages(conversationId: number) {
    return this.request<any[]>(
      `/api/instagram/conversations/${conversationId}/messages`
    );
  }

  async sendMessage(accountId: number, recipientId: string, message: string) {
    return this.request(`/api/instagram/accounts/${accountId}/send-message`, {
      method: "POST",
      body: JSON.stringify({
        recipient_id: recipientId,
        message_text: message,
      }),
    });
  }

  async getInstagramStats() {
    return this.request<any>("/api/instagram/stats");
  }

  // Automation endpoints
  async getAutomationRules(accountId?: number) {
    const params = accountId ? `?account_id=${accountId}` : "";
    return this.request<any[]>(`/api/automation/rules${params}`);
  }

  async createAutomationRule(data: any) {
    return this.request("/api/automation/rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAutomationRule(ruleId: number, data: any) {
    return this.request(`/api/automation/rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAutomationRule(ruleId: number) {
    return this.request(`/api/automation/rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  async toggleAutomationRule(ruleId: number) {
    return this.request(`/api/automation/rules/${ruleId}/toggle`, {
      method: "POST",
    });
  }

  async getAutomationStats() {
    return this.request<any>("/api/automation/stats");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
