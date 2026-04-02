import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Skill, Plugin, ClawhubSkill } from '../types/index.js';

const execFileAsync = promisify(execFile);

const CLI_TIMEOUT_MS = 30_000;
const CLI_MAX_BUFFER = 10 * 1024 * 1024;

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
      timeout: CLI_TIMEOUT_MS,
      maxBuffer: CLI_MAX_BUFFER,
    });
    return stdout;
  }

  private async runNpx(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync('npx', args, {
      timeout: CLI_TIMEOUT_MS,
      maxBuffer: CLI_MAX_BUFFER,
    });
    return stdout;
  }

  async listSkills(): Promise<Skill[]> {
    const output = await this.runOpenClaw(['skills', 'list', '--json']);
    try {
      const parsed = JSON.parse(output) as SkillsListOutput;
      return parsed.skills;
    } catch (error) {
      throw new Error(`Failed to parse skills from CLI output: ${(error as Error).message}`);
    }
  }

  async listPlugins(): Promise<Plugin[]> {
    const output = await this.runOpenClaw(['plugins', 'list', '--json']);
    try {
      const parsed = JSON.parse(output) as PluginsListOutput;
      return parsed.plugins;
    } catch (error) {
      throw new Error(`Failed to parse plugins from CLI output: ${(error as Error).message}`);
    }
  }

  /**
   * Search the clawhub registry for skills.
   * Parses the plain-text output of `npx clawhub@latest search <query>`.
   * Each result line is: <slug>  <Display Name>  (<score>)
   */
  async searchClawhub(query: string, limit = 20): Promise<ClawhubSkill[]> {
    const output = await this.runNpx([
      'clawhub@latest',
      'search',
      query,
      '--limit',
      String(limit),
      '--no-input',
    ]);

    const results: ClawhubSkill[] = [];
    for (const line of output.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('-')) continue;

      const match = trimmed.match(/^(\S+)\s+(.+?)\s+\(([\d.]+)\)$/);
      if (match) {
        results.push({
          slug: match[1],
          name: match[2],
          score: parseFloat(match[3]),
        });
      }
    }
    return results;
  }

  /**
   * Install a skill from clawhub into the given agent workspace.
   * Uses `npx clawhub@latest install <slug> --workdir <workspace>`.
   */
  async installSkillFromClawhub(slug: string, workspacePath: string): Promise<void> {
    await this.runNpx([
      'clawhub@latest',
      'install',
      slug,
      '--workdir',
      workspacePath,
      '--no-input',
    ]);
  }

  async enablePlugin(id: string): Promise<void> {
    await this.runOpenClaw(['plugins', 'enable', id]);
  }

  async disablePlugin(id: string): Promise<void> {
    await this.runOpenClaw(['plugins', 'disable', id]);
  }

  async installPlugin(spec: string): Promise<void> {
    await this.runOpenClaw(['plugins', 'install', spec]);
  }
}
