import type { Agent, FileInfo, FileContent, ApiError } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  async getAgents(): Promise<{ agents: Agent[] }> {
    return this.fetch<{ agents: Agent[] }>('/agents');
  }

  async getAgent(id: string): Promise<{ agent: Agent; files: FileInfo[] }> {
    return this.fetch<{ agent: Agent; files: FileInfo[] }>(`/agents/${id}`);
  }

  async getFile(agentId: string, fileName: string): Promise<FileContent> {
    return this.fetch<FileContent>(`/agents/${agentId}/files/${fileName}`);
  }

  async saveFile(
    agentId: string,
    fileName: string,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    return this.fetch<{ success: boolean; message: string }>(
      `/agents/${agentId}/files/${fileName}`,
      {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }
    );
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetch<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();
