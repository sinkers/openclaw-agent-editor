import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Skill, Plugin } from '../types/index.js';

const execFileAsync = promisify(execFile);

interface SkillsListOutput {
  skills: Skill[];
}

interface PluginsListOutput {
  workspaceDir: string;
  plugins: Plugin[];
}

export class CliService {
  private async runOpenClaw(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync('openclaw', args, {
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  }

  async listSkills(): Promise<Skill[]> {
    const output = await this.runOpenClaw(['skills', 'list', '--json']);
    const parsed = JSON.parse(output) as SkillsListOutput;
    return parsed.skills;
  }

  async listPlugins(): Promise<Plugin[]> {
    const output = await this.runOpenClaw(['plugins', 'list', '--json']);
    const parsed = JSON.parse(output) as PluginsListOutput;
    return parsed.plugins;
  }

  async installSkill(name: string): Promise<void> {
    await this.runOpenClaw(['skills', 'install', name]);
  }

  async enablePlugin(id: string): Promise<void> {
    await this.runOpenClaw(['plugins', 'enable', id]);
  }

  async disablePlugin(id: string): Promise<void> {
    await this.runOpenClaw(['plugins', 'disable', id]);
  }
}
