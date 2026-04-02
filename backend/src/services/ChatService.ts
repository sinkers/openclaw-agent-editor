import type { Response } from 'express';
import type { IncomingMessage } from 'http';
import { request as httpRequest } from 'http';
import type { ConfigService } from './ConfigService.js';
import type { ChatMessage } from '../types/index.js';

export class ChatService {
  constructor(private configService: ConfigService) {}

  async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    const config = await this.configService.getRawConfig();
    const port = config.gateway?.port ?? 18789;
    const token = config.gateway?.auth?.token ?? '';

    const body = JSON.stringify({
      model: 'openclaw',
      messages,
      stream: true,
    });

    await new Promise<void>((resolve, reject) => {
      const req = httpRequest(
        {
          hostname: 'localhost',
          port,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
        (upstream: IncomingMessage) => {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();

          upstream.on('data', (chunk: Buffer) => {
            res.write(chunk);
          });

          upstream.on('end', () => {
            res.end();
            resolve();
          });

          upstream.on('error', (err: Error) => {
            reject(err);
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
