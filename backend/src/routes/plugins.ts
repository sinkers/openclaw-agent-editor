import { Router, type Request, type Response } from 'express';
import { CliService } from '../services/CliService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const cliService = new CliService();

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
