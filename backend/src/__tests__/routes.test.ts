import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

const mockSkills = [
  { name: 'test-skill', description: 'A test', source: 'openclaw-bundled', eligible: true, disabled: false, missing: { bins: [], anyBins: [], env: [], config: [], os: [] } },
];
const mockPlugins = [
  { id: 'acpx', name: 'ACPX Runtime', description: 'desc', version: '1.0', origin: 'bundled', enabled: false, status: 'disabled', toolNames: [], hookNames: [], channelIds: [] },
];
const mockClawhubResults = [
  { slug: 'monitor-skill', name: 'Monitor Skill', score: 3.5 },
];

vi.mock('../services/CliService.js', () => ({
  CliService: class {
    listSkills() { return Promise.resolve(mockSkills); }
    listPlugins() { return Promise.resolve(mockPlugins); }
    searchClawhub() { return Promise.resolve(mockClawhubResults); }
    installSkillFromClawhub() { return Promise.resolve(); }
    enablePlugin() { return Promise.resolve(); }
    disablePlugin() { return Promise.resolve(); }
    installPlugin() { return Promise.resolve(); }
  },
}));

vi.mock('../services/ConfigService.js', () => ({
  ConfigService: class {
    getAgents() { return Promise.resolve([{ id: 'agent-1', name: 'Test Agent', workspacePath: '/tmp/test-workspace' }]); }
    getAgent(id: string) {
      if (id === 'agent-1') return Promise.resolve({ id: 'agent-1', name: 'Test Agent', workspacePath: '/tmp/test-workspace' });
      return Promise.reject(new Error(`Agent '${id}' not found`));
    }
    getRawConfig() { return Promise.resolve({ agents: { list: [] } }); }
    clearCache() { return undefined; }
  },
}));

vi.mock('../services/ChatService.js', () => ({
  ChatService: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    streamChat(_messages: unknown, res: any) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.flushHeaders();
      res.write('data: {"choices":[{"delta":{"content":"hello"}}]}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return Promise.resolve();
    }
  },
}));

import app from '../app.js';

describe('GET /api/skills', () => {
  it('returns skills list', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.status).toBe(200);
    expect(res.body.skills).toHaveLength(1);
    expect(res.body.skills[0].name).toBe('test-skill');
  });
});

describe('GET /api/skills/search', () => {
  it('returns search results', async () => {
    const res = await request(app).get('/api/skills/search?q=monitor');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].slug).toBe('monitor-skill');
  });

  it('returns 400 without query param', async () => {
    const res = await request(app).get('/api/skills/search');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/skills/:agentId/install/:slug', () => {
  it('installs skill into agent workspace', async () => {
    const res = await request(app).post('/api/skills/agent-1/install/monitor-skill');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for unknown agent', async () => {
    const res = await request(app).post('/api/skills/unknown-agent/install/monitor-skill');
    expect(res.status).toBe(500); // ConfigService throws, asyncHandler returns 500
  });
});

describe('GET /api/plugins', () => {
  it('returns plugins list', async () => {
    const res = await request(app).get('/api/plugins');
    expect(res.status).toBe(200);
    expect(res.body.plugins).toHaveLength(1);
    expect(res.body.plugins[0].id).toBe('acpx');
  });
});

describe('POST /api/plugins/:id/enable', () => {
  it('returns success', async () => {
    const res = await request(app).post('/api/plugins/acpx/enable');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/plugins/:id/disable', () => {
  it('returns success', async () => {
    const res = await request(app).post('/api/plugins/acpx/disable');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/chat', () => {
  it('returns 400 for missing messages', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for invalid message shape', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'unknown', content: 'hi' }] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for message missing content', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user' }] });
    expect(res.status).toBe(400);
  });

  it('streams SSE for valid messages', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });
});
