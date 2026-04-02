import type { Request, Response } from 'express';
import type { ApiError } from '../types/index.js';

export const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    fn(req, res).catch((error: Error) => {
      console.error('API Error:', error);
      const apiError: ApiError = { error: error.message, code: 'INTERNAL_ERROR' };
      res.status(500).json(apiError);
    });
  };
};
