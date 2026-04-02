import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must be hoisted before the import of CliService so the mock is in place
// when execFileAsync = promisify(execFile) runs at module load time.
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'child_process';
import { CliService } from '../services/CliService.js';

// promisify wraps execFile as execFile(cmd, args, opts, callback).
// We simulate it by calling the last argument (the callback) with (null, stdout).
const mockExecFile = vi.mocked(execFile);

// vi.mocked preserves the strict execFile signature; cast to any for test implementation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockImpl = mockExecFile as unknown as { mockImplementation: (fn: (...args: any[]) => void) => void };

function mockSuccess(stdout: string) {
  mockImpl.mockImplementation((...args: unknown[]) => {
    const callback = args[args.length - 1] as (err: null, result: { stdout: string }) => void;
    callback(null, { stdout });
  });
}

function mockFailure(message: string) {
  mockImpl.mockImplementation((...args: unknown[]) => {
    const callback = args[args.length - 1] as (err: Error) => void;
    callback(new Error(message));
  });
}

describe('CliService', () => {
  let service: CliService;

  beforeEach(() => {
    service = new CliService();
    vi.clearAllMocks();
  });

  describe('listSkills', () => {
    it('parses skills from CLI output', async () => {
      const skillsOutput = {
        skills: [
          { name: 'test-skill', description: 'A test skill', source: 'openclaw-bundled', eligible: true, missing: false },
          { name: 'other-skill', description: 'Another skill', emoji: '🛠', source: 'openclaw-workspace', eligible: false, missing: true },
        ],
      };
      mockSuccess(JSON.stringify(skillsOutput));

      const skills = await service.listSkills();

      expect(mockExecFile).toHaveBeenCalledWith('openclaw', ['skills', 'list', '--json'], expect.any(Object), expect.any(Function));
      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('test-skill');
      expect(skills[0].eligible).toBe(true);
      expect(skills[1].emoji).toBe('🛠');
    });

    it('throws when CLI fails', async () => {
      mockFailure('command not found: openclaw');

      await expect(service.listSkills()).rejects.toThrow('command not found: openclaw');
    });
  });

  describe('listPlugins', () => {
    it('parses plugins from CLI output', async () => {
      const pluginsOutput = {
        workspaceDir: '/Users/test/clawd',
        plugins: [
          {
            id: 'acpx',
            name: 'ACPX Runtime',
            description: 'ACPX plugin',
            version: '2026.3.13',
            origin: 'bundled',
            enabled: false,
            status: 'disabled',
            toolNames: [],
            hookNames: [],
            channelIds: [],
          },
        ],
      };
      mockSuccess(JSON.stringify(pluginsOutput));

      const plugins = await service.listPlugins();

      expect(mockExecFile).toHaveBeenCalledWith('openclaw', ['plugins', 'list', '--json'], expect.any(Object), expect.any(Function));
      expect(plugins).toHaveLength(1);
      expect(plugins[0].id).toBe('acpx');
      expect(plugins[0].enabled).toBe(false);
    });
  });

  describe('searchClawhub', () => {
    it('parses clawhub search results from CLI output', async () => {
      const cliOutput = '- Searching\nmonitor-skill  Monitor Skill  (3.586)\nauto-monitor  Auto Monitor  (3.500)\n';
      mockSuccess(cliOutput);

      const results = await service.searchClawhub('monitor', 10);

      expect(mockExecFile).toHaveBeenCalledWith('npx', ['clawhub@latest', 'search', 'monitor', '--limit', '10', '--no-input'], expect.any(Object), expect.any(Function));
      expect(results).toHaveLength(2);
      expect(results[0].slug).toBe('monitor-skill');
      expect(results[0].name).toBe('Monitor Skill');
      expect(results[0].score).toBeCloseTo(3.586);
    });

    it('returns empty array when no results', async () => {
      mockSuccess('- Searching\n');
      const results = await service.searchClawhub('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('installSkillFromClawhub', () => {
    it('calls npx clawhub install with slug and workdir', async () => {
      mockSuccess('');

      await service.installSkillFromClawhub('monitor-skill', '/path/to/workspace');

      expect(mockExecFile).toHaveBeenCalledWith('npx', ['clawhub@latest', 'install', 'monitor-skill', '--workdir', '/path/to/workspace', '--no-input'], expect.any(Object), expect.any(Function));
    });
  });

  describe('enablePlugin', () => {
    it('calls openclaw plugins enable with the plugin id', async () => {
      mockSuccess('');

      await service.enablePlugin('acpx');

      expect(mockExecFile).toHaveBeenCalledWith('openclaw', ['plugins', 'enable', 'acpx'], expect.any(Object), expect.any(Function));
    });
  });

  describe('disablePlugin', () => {
    it('calls openclaw plugins disable with the plugin id', async () => {
      mockSuccess('');

      await service.disablePlugin('acpx');

      expect(mockExecFile).toHaveBeenCalledWith('openclaw', ['plugins', 'disable', 'acpx'], expect.any(Object), expect.any(Function));
    });
  });
});
