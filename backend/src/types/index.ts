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
  lastModified?: Date;
}

export interface FileContent {
  fileName: string;
  content: string;
  lastModified: Date;
}

export interface OpenClawConfig {
  agents: {
    defaults?: {
      workspace?: string;
    };
    list: Array<{
      id: string;
      name?: string;
      workspace?: string;
    }>;
  };
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
