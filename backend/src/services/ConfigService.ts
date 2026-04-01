import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Agent, OpenClawConfig } from '../types/index.js';

export class ConfigService {
  private openclawPath: string;
  private configPath: string;
  private cachedConfig: OpenClawConfig | null = null;

  constructor() {
    this.openclawPath = join(homedir(), '.openclaw');
    this.configPath = join(this.openclawPath, 'openclaw.json');
  }

  /**
   * Parse openclaw.json configuration file
   */
  private async parseOpenClawConfig(): Promise<OpenClawConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    try {
      const configContent = await readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configContent) as OpenClawConfig;

      if (!config.agents?.list || !Array.isArray(config.agents.list)) {
        throw new Error('Invalid openclaw.json: missing agents.list array');
      }

      this.cachedConfig = config;
      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `OpenClaw configuration not found at ${this.configPath}. ` +
          'Please ensure OpenClaw is installed and configured.'
        );
      }
      throw error;
    }
  }

  /**
   * Get all configured agents
   */
  async getAgents(): Promise<Agent[]> {
    const config = await this.parseOpenClawConfig();

    return config.agents.list.map(agent => ({
      id: agent.id,
      name: agent.name || agent.id,
      workspacePath: join(this.openclawPath, `workspace-${agent.id}`),
    }));
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    const agents = await this.getAgents();
    const agent = agents.find(a => a.id === id);

    if (!agent) {
      throw new Error(`Agent '${id}' not found in openclaw.json`);
    }

    return agent;
  }

  /**
   * Clear cached config (useful for testing or when config changes)
   */
  clearCache(): void {
    this.cachedConfig = null;
  }
}
