import { Router, type Request, type Response } from 'express';
import { ChatService } from '../services/ChatService.js';
import { ConfigService } from '../services/ConfigService.js';
import type { ApiError, ChatMessage } from '../types/index.js';

const router = Router();
const configService = new ConfigService();
const chatService = new ChatService(configService);

/**
 * POST /api/chat
 * Proxy a chat request to the OpenClaw gateway, streaming SSE back to the client.
 * Body: { messages: ChatMessage[] }
 */
router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body as { messages?: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    const apiError: ApiError = {
      error: 'messages must be a non-empty array',
      code: 'INVALID_REQUEST',
    };
    res.status(400).json(apiError);
    return;
  }

  // Basic shape validation
  for (const msg of messages) {
    if (
      typeof msg !== 'object' ||
      msg === null ||
      !['user', 'assistant', 'system'].includes((msg as ChatMessage).role) ||
      typeof (msg as ChatMessage).content !== 'string'
    ) {
      const apiError: ApiError = {
        error: 'Each message must have a valid role and string content',
        code: 'INVALID_REQUEST',
      };
      res.status(400).json(apiError);
      return;
    }
  }

  try {
    await chatService.streamChat(messages as ChatMessage[], res);
  } catch (error) {
    if (!res.headersSent) {
      const apiError: ApiError = {
        error: (error as Error).message,
        code: 'GATEWAY_ERROR',
      };
      res.status(502).json(apiError);
    }
  }
});

export default router;
