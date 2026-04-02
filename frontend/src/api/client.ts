import type { Agent, FileInfo, FileContent, ApiError, Skill, Plugin, ClawhubSkill, ChatMessage } from '../types';
import { useInstanceStore } from '../store/instanceStore';

function getApiBase(): string {
  return useInstanceStore.getState().getActiveApiBase();
}

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
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

  async getSkills(): Promise<{ skills: Skill[] }> {
    return this.fetch<{ skills: Skill[] }>('/skills');
  }

  async searchClawhub(query: string, limit = 20): Promise<{ results: ClawhubSkill[] }> {
    return this.fetch<{ results: ClawhubSkill[] }>(
      `/skills/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async installSkillFromClawhub(
    agentId: string,
    slug: string
  ): Promise<{ success: boolean; message: string }> {
    return this.fetch<{ success: boolean; message: string }>(
      `/skills/${encodeURIComponent(agentId)}/install/${encodeURIComponent(slug)}`,
      { method: 'POST' }
    );
  }

  async getPlugins(): Promise<{ plugins: Plugin[] }> {
    return this.fetch<{ plugins: Plugin[] }>('/plugins');
  }

  async enablePlugin(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetch<{ success: boolean; message: string }>(`/plugins/${encodeURIComponent(id)}/enable`, {
      method: 'POST',
    });
  }

  async disablePlugin(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetch<{ success: boolean; message: string }>(`/plugins/${encodeURIComponent(id)}/disable`, {
      method: 'POST',
    });
  }

  /**
   * Stream a chat response from the gateway.
   * Returns a raw Response so the caller can consume the SSE stream.
   * Pass an AbortSignal to cancel mid-stream.
   */
  async exportAgent(agentId: string): Promise<{ agentId: string; exportedAt: string; files: Record<string, string> }> {
    return this.fetch<{ agentId: string; exportedAt: string; files: Record<string, string> }>(
      `/agents/${encodeURIComponent(agentId)}/export`
    );
  }

  async importAgent(
    agentId: string,
    files: Record<string, string>
  ): Promise<{ success: boolean; written: string[] }> {
    return this.fetch<{ success: boolean; written: string[] }>(
      `/agents/${encodeURIComponent(agentId)}/import`,
      {
        method: 'POST',
        body: JSON.stringify({ files }),
      }
    );
  }

  async chatStream(messages: ChatMessage[], signal?: AbortSignal): Promise<globalThis.Response> {
    const response = await fetch(`${getApiBase()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Chat request failed');
    }

    return response;
  }
}

export const apiClient = new ApiClient();
