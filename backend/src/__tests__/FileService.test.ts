import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileService } from '../services/FileService.js';
import { ALLOWED_FILES } from '../types/index.js';

describe('FileService', () => {
  let tmpBase: string;
  let workspacePath: string;
  let service: FileService;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'openclaw-test-'));
    workspacePath = join(tmpBase, 'workspace-test-agent');
    service = new FileService();
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  describe('listFiles', () => {
    it('returns all allowed files with exists:false when workspace is empty', async () => {
      const files = await service.listFiles(workspacePath);
      expect(files).toHaveLength(ALLOWED_FILES.length);
      for (const f of files) {
        expect(f.exists).toBe(false);
      }
    });

    it('marks a file as exists when it is present on disk', async () => {
      await mkdir(workspacePath, { recursive: true });
      await writeFile(join(workspacePath, 'SOUL.md'), '# Soul', 'utf-8');

      const files = await service.listFiles(workspacePath);
      const soul = files.find(f => f.name === 'SOUL.md')!;
      expect(soul.exists).toBe(true);
      expect(soul.size).toBeGreaterThan(0);
    });
  });

  describe('readFile', () => {
    it('returns empty content for a non-existent file', async () => {
      const result = await service.readFile(workspacePath, 'SOUL.md');
      expect(result.fileName).toBe('SOUL.md');
      expect(result.content).toBe('');
    });

    it('returns file content when the file exists', async () => {
      await mkdir(workspacePath, { recursive: true });
      await writeFile(join(workspacePath, 'IDENTITY.md'), '# Identity', 'utf-8');

      const result = await service.readFile(workspacePath, 'IDENTITY.md');
      expect(result.content).toBe('# Identity');
    });

    it('throws for disallowed file names', async () => {
      await expect(service.readFile(workspacePath, 'evil.sh')).rejects.toThrow('Invalid file name');
    });
  });

  describe('writeFile', () => {
    it('writes content and can be read back', async () => {
      await service.writeFile(workspacePath, 'USER.md', '# User Notes');
      const result = await service.readFile(workspacePath, 'USER.md');
      expect(result.content).toBe('# User Notes');
    });

    it('creates a backup (.bak) before overwriting', async () => {
      await service.writeFile(workspacePath, 'TOOLS.md', 'original');
      await service.writeFile(workspacePath, 'TOOLS.md', 'updated');

      const backup = await readFile(join(workspacePath, 'TOOLS.md.bak'), 'utf-8');
      expect(backup).toBe('original');
    });

    it('throws for disallowed file names', async () => {
      await expect(service.writeFile(workspacePath, 'malicious.js', 'code')).rejects.toThrow('Invalid file name');
    });
  });
});
