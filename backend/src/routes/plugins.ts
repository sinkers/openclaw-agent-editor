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
 * GET /api/plugins
 * List all plugins
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const plugins = await cliService.listPlugins();
  res.json({ plugins });
}));

/**
 * POST /api/plugins/:id/enable
 * Enable a plugin
 */
router.post(
  '/:id/enable',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await cliService.enablePlugin(id);
    res.json({ success: true, message: `Plugin '${id}' enabled` });
  })
);

/**
 * POST /api/plugins/:id/disable
 * Disable a plugin
 */
router.post(
  '/:id/disable',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await cliService.disablePlugin(id);
    res.json({ success: true, message: `Plugin '${id}' disabled` });
  })
);

export default router;
