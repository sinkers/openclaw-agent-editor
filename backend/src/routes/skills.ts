import { Router, type Request, type Response } from 'express';
import { CliService } from '../services/CliService.js';
import { ConfigService } from '../services/ConfigService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const cliService = new CliService();
const configService = new ConfigService();

/**
 * GET /api/skills
 * List installed skills for the default workspace
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const skills = await cliService.listSkills();
  res.json({ skills });
}));

/**
 * GET /api/skills/search?q=<query>&limit=<n>
 * Search the clawhub registry
 */
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query;
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'q query param required', code: 'INVALID_REQUEST' });
    return;
  }
  const results = await cliService.searchClawhub(q, limit ? Number(limit) : 20);
  res.json({ results });
}));

/**
 * POST /api/skills/:agentId/install/:slug
 * Install a skill from clawhub into a specific agent's workspace
 */
router.post(
  '/:agentId/install/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, slug } = req.params;
    const agent = await configService.getAgent(agentId);
    await cliService.installSkillFromClawhub(slug, agent.workspacePath);
    res.json({ success: true, message: `Skill '${slug}' installed into agent '${agentId}'` });
  })
);

export default router;
