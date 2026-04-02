import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConfigService } from '../services/ConfigService.js';

class TestConfigService extends ConfigService {
  constructor(basePath: string) {
    super();
    (this as unknown as { openclawPath: string }).openclawPath = basePath;
    (this as unknown as { configPath: string }).configPath = join(basePath, 'openclaw.json');
  }
}

describe('ConfigService', () => {
  let tmpBase: string;
  let service: TestConfigService;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'openclaw-config-test-'));
    service = new TestConfigService(tmpBase);
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('throws when config file is missing', async () => {
    await expect(service.getAgents()).rejects.toThrow('OpenClaw configuration not found');
  });

  it('throws for invalid config structure', async () => {
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify({ agents: {} }), 'utf-8');
    await expect(service.getAgents()).rejects.toThrow('Invalid openclaw.json');
  });

  it('returns agents from a valid config', async () => {
    const config = {
      agents: {
        list: [
          { id: 'agent-1', name: 'First Agent' },
          { id: 'agent-2' },
        ],
      },
    };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    const agents = await service.getAgents();
    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe('agent-1');
    expect(agents[0].name).toBe('First Agent');
    expect(agents[1].id).toBe('agent-2');
    expect(agents[1].name).toBe('agent-2'); // falls back to id
  });

  it('uses defaults.workspace as workspacePath when set', async () => {
    const config = {
      agents: {
        defaults: { workspace: '/some/default/workspace' },
        list: [{ id: 'agent-1' }],
      },
    };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    const agents = await service.getAgents();
    expect(agents[0].workspacePath).toBe('/some/default/workspace');
  });

  it('per-agent workspace overrides defaults.workspace', async () => {
    const config = {
      agents: {
        defaults: { workspace: '/default/path' },
        list: [{ id: 'agent-1', workspace: '/custom/agent/path' }],
      },
    };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    const agents = await service.getAgents();
    expect(agents[0].workspacePath).toBe('/custom/agent/path');
  });

  it('falls back to ~/.openclaw/workspace-{id} when no workspace configured', async () => {
    const config = {
      agents: { list: [{ id: 'agent-1' }] },
    };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    const agents = await service.getAgents();
    expect(agents[0].workspacePath).toBe(join(tmpBase, 'workspace-agent-1'));
  });

  it('getAgent returns the correct agent by id', async () => {
    const config = {
      agents: { list: [{ id: 'my-agent', name: 'My Agent' }] },
    };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    const agent = await service.getAgent('my-agent');
    expect(agent.id).toBe('my-agent');
  });

  it('getAgent throws for unknown id', async () => {
    const config = { agents: { list: [{ id: 'agent-1' }] } };
    await writeFile(join(tmpBase, 'openclaw.json'), JSON.stringify(config), 'utf-8');

    await expect(service.getAgent('nope')).rejects.toThrow("Agent 'nope' not found");
  });
});
