import { Router, type Request, type Response } from 'express';
import { CliService } from '../services/CliService.js';
import type { ApiError } from '../types/index.js';

const router = Router();
const cliService = new CliService();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    fn(req, res).catch((error: Error) => {
      console.error('API Error:', error);
      const apiError: ApiError = { error: error.message, code: 'INTERNAL_ERROR' };
      res.status(500).json(apiError);
    });
  };
};

/**
 * GET /api/skills
 * List all skills
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const skills = await cliService.listSkills();
  res.json({ skills });
}));

/**
 * POST /api/skills/:name/install
 * Install a skill
 */
router.post(
  '/:name/install',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    await cliService.installSkill(name);
    res.json({ success: true, message: `Skill '${name}' installed` });
  })
);

export default router;
