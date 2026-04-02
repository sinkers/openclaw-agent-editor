export interface Agent {
  id: string;
  name?: string;
  workspacePath: string;
}

export interface FileInfo {
  name: string;
  path: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

export interface FileContent {
  fileName: string;
  content: string;
  lastModified: string;
}

export interface SkillMissing {
  bins: string[];
  anyBins: string[];
  env: string[];
  config: string[];
  os: string[];
}

export interface Skill {
  name: string;
  description: string;
  emoji?: string;
  source: string;
  eligible: boolean;
  disabled: boolean;
  missing: SkillMissing;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  origin: string;
  enabled: boolean;
  status: string;
  toolNames: string[];
  hookNames: string[];
  channelIds: string[];
}

export interface ClawhubSkill {
  slug: string;
  name: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export const ALLOWED_FILES = [
  'SOUL.md',
  'IDENTITY.md',
  'AGENTS.md',
  'USER.md',
  'TOOLS.md',
  'HEARTBEAT.md',
  'BOOTSTRAP.md',
] as const;

export type AllowedFileName = typeof ALLOWED_FILES[number];
