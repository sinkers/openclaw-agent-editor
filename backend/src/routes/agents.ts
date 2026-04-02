import { Router, type Request, type Response } from 'express';
import { ConfigService } from '../services/ConfigService.js';
import { FileService } from '../services/FileService.js';
import type { ApiError } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const configService = new ConfigService();
const fileService = new FileService();

/**
 * GET /api/agents
 * List all configured agents
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const agents = await configService.getAgents();
  res.json({ agents });
}));

/**
 * GET /api/agents/:agentId
 * Get agent details with file list
 */
router.get('/:agentId', asyncHandler(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  try {
    const agent = await configService.getAgent(agentId);
    const files = await fileService.listFiles(agent.workspacePath);

    res.json({
      agent,
      files,
    });
  } catch (error) {
    const apiError: ApiError = {
      error: (error as Error).message,
      code: 'AGENT_NOT_FOUND',
    };
    res.status(404).json(apiError);
  }
}));

/**
 * GET /api/agents/:agentId/files/:fileName
 * Read a markdown file
 */
router.get(
  '/:agentId/files/:fileName',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, fileName } = req.params;

    try {
      const agent = await configService.getAgent(agentId);
      const fileContent = await fileService.readFile(agent.workspacePath, fileName);
      res.json(fileContent);
    } catch (error) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'FILE_READ_ERROR',
      };
      res.status(400).json(apiError);
    }
  })
);

/**
 * PUT /api/agents/:agentId/files/:fileName
 * Save a markdown file (creates backup first)
 */
router.put(
  '/:agentId/files/:fileName',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId, fileName } = req.params;
    const { content } = req.body;

    if (typeof content !== 'string') {
      const apiError: ApiError = {
        error: 'Content must be a string',
        code: 'INVALID_CONTENT',
      };
      res.status(400).json(apiError);
      return;
    }

    try {
      const agent = await configService.getAgent(agentId);
      await fileService.writeFile(agent.workspacePath, fileName, content);
      res.json({
        success: true,
        message: 'File saved successfully',
        fileName,
      });
    } catch (error) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'FILE_WRITE_ERROR',
      };
      res.status(400).json(apiError);
    }
  })
);

/**
 * GET /api/agents/:agentId/export
 * Export all agent markdown files as a JSON bundle
 */
router.get(
  '/:agentId/export',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;
    try {
      const agent = await configService.getAgent(agentId);
      const bundle = await fileService.exportAgent(agent.workspacePath);
      res.json({
        agentId,
        exportedAt: new Date().toISOString(),
        files: bundle,
      });
    } catch (error) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'AGENT_NOT_FOUND',
      };
      res.status(404).json(apiError);
    }
  })
);

/**
 * POST /api/agents/:agentId/import
 * Import agent markdown files from a JSON bundle
 * Body: { files: Record<string, string> }
 */
router.post(
  '/:agentId/import',
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;
    const { files } = req.body as { files?: unknown };

    if (!files || typeof files !== 'object' || Array.isArray(files)) {
      const apiError: ApiError = {
        error: 'Body must include "files" as an object mapping filename to content',
        code: 'INVALID_CONTENT',
      };
      res.status(400).json(apiError);
      return;
    }

    let agent;
    try {
      agent = await configService.getAgent(agentId);
    } catch (error) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'AGENT_NOT_FOUND',
      };
      res.status(404).json(apiError);
      return;
    }

    try {
      const written = await fileService.importAgent(
        agent.workspacePath,
        files as Record<string, string>
      );
      res.json({ success: true, written });
    } catch (error) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'IMPORT_ERROR',
      };
      res.status(400).json(apiError);
    }
  })
);

export default router;
