import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Agent Editor API running on http://localhost:${PORT}`);
  console.log(`📁 Serving from ~/.openclaw/`);
});
