import { readFile, writeFile, stat, copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { FileInfo, FileContent, AllowedFileName } from '../types/index.js';
import { ALLOWED_FILES } from '../types/index.js';

export class FileService {
  /**
   * Validate that the filename is in the allowed list
   */
  private validateFileName(fileName: string): asserts fileName is AllowedFileName {
    if (!ALLOWED_FILES.includes(fileName as AllowedFileName)) {
      throw new Error(
        `Invalid file name: ${fileName}. ` +
        `Allowed files: ${ALLOWED_FILES.join(', ')}`
      );
    }
  }

  /**
   * Resolve and validate file path to prevent directory traversal
   */
  private getFilePath(workspacePath: string, fileName: string): string {
    this.validateFileName(fileName);

    const filePath = join(workspacePath, fileName);

    // Ensure the resolved path is still within the workspace
    if (!filePath.startsWith(workspacePath)) {
      throw new Error('Invalid file path: directory traversal detected');
    }

    return filePath;
  }

  /**
   * Create a backup of the file before modifying it
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.bak`;
      await copyFile(filePath, backupPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to create backup: ${(error as Error).message}`);
      }
      // File doesn't exist, no backup needed
    }
  }

  /**
   * List all markdown files for an agent
   */
  async listFiles(workspacePath: string): Promise<FileInfo[]> {
    const fileInfos = await Promise.all(
      ALLOWED_FILES.map(async (fileName) => {
        const filePath = join(workspacePath, fileName);
        const fileInfo: FileInfo = {
          name: fileName,
          path: filePath,
          exists: false,
        };

        try {
          const stats = await stat(filePath);
          fileInfo.exists = true;
          fileInfo.size = stats.size;
          fileInfo.lastModified = stats.mtime;
        } catch (error) {
          // File doesn't exist, keep exists: false
        }

        return fileInfo;
      })
    );

    return fileInfos;
  }

  /**
   * Read a markdown file
   */
  async readFile(workspacePath: string, fileName: string): Promise<FileContent> {
    const filePath = this.getFilePath(workspacePath, fileName);

    try {
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);

      return {
        fileName,
        content,
        lastModified: stats.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty content
        return {
          fileName,
          content: '',
          lastModified: new Date(),
        };
      }
      throw error;
    }
  }

  /**
   * Export all files for an agent as a bundle object
   */
  async exportAgent(workspacePath: string): Promise<Record<string, string>> {
    const bundle: Record<string, string> = {};
    await Promise.all(
      ALLOWED_FILES.map(async (fileName) => {
        const filePath = join(workspacePath, fileName);
        try {
          const content = await readFile(filePath, 'utf-8');
          bundle[fileName] = content;
        } catch {
          // Skip files that don't exist
        }
      })
    );
    return bundle;
  }

  /**
   * Import files from a bundle object, writing each file
   */
  async importAgent(workspacePath: string, bundle: Record<string, string>): Promise<string[]> {
    const written: string[] = [];
    await Promise.all(
      ALLOWED_FILES.map(async (fileName) => {
        if (typeof bundle[fileName] === 'string') {
          await this.writeFile(workspacePath, fileName, bundle[fileName]);
          written.push(fileName);
        }
      })
    );
    return written;
  }

  /**
   * Write content to a markdown file (creates backup first)
   */
  async writeFile(
    workspacePath: string,
    fileName: string,
    content: string
  ): Promise<void> {
    const filePath = this.getFilePath(workspacePath, fileName);

    // Ensure workspace directory exists
    const workspaceDir = dirname(filePath);
    await mkdir(workspaceDir, { recursive: true });

    // Create backup before writing
    await this.createBackup(filePath);

    // Write the file atomically (write to temp, then rename)
    const tempPath = `${filePath}.tmp`;
    try {
      await writeFile(tempPath, content, 'utf-8');

      // On Unix systems, rename is atomic
      await writeFile(filePath, content, 'utf-8');
    } finally {
      // Clean up temp file if it exists
      try {
        await stat(tempPath);
        await writeFile(tempPath, ''); // Clear it before potential removal
      } catch {
        // Temp file doesn't exist or already cleaned up
      }
    }
  }
}
