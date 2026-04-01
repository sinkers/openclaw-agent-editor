import { useAppStore } from '../../store/appStore';
import { ALLOWED_FILES, type FileInfo } from '../../types';
import { MarkdownEditor } from './MarkdownEditor';

interface FileTabsViewProps {
  agentId: string;
  files: FileInfo[];
}

export function FileTabsView({ agentId, files }: FileTabsViewProps) {
  const { currentFileName, setCurrentFile } = useAppStore();

  const handleTabClick = (fileName: string) => {
    setCurrentFile(fileName);
  };

  const activeFile = currentFileName || ALLOWED_FILES[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* File Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto">
        <div className="flex gap-1">
          {ALLOWED_FILES.map((fileName) => {
            const fileInfo = files.find((f) => f.name === fileName);
            const isActive = activeFile === fileName;

            return (
              <button
                key={fileName}
                onClick={() => handleTabClick(fileName)}
                className={`
                  px-4 py-2 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }
                `}
              >
                {fileName.replace('.md', '')}
                {!fileInfo?.exists && (
                  <span className="ml-1 text-xs opacity-50">*</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor agentId={agentId} fileName={activeFile} />
      </div>
    </div>
  );
}
