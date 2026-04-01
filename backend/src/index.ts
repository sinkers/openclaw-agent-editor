import express, { type Request, type Response } from 'express';
import cors from 'cors';
import agentsRouter from './routes/agents.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'openclaw-agent-editor-backend',
  });
});

// API routes
app.use('/api/agents', agentsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Agent Editor API running on http://localhost:${PORT}`);
  console.log(`📁 Serving from ~/.openclaw/`);
});
