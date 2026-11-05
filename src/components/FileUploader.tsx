import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileCode, 
  Plus, 
  Trash2, 
  FolderOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  FileText,
  Play,
  RotateCcw
} from 'lucide-react';
import { ProjectFile } from '../types/security';

interface FileUploaderProps {
  files: ProjectFile[];
  selectedFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFiles: (newFiles: ProjectFile[]) => void;
  onDeleteFile: (fileId: string) => void;
  onStartAudit: (targetFileIds?: string[]) => void;
  isScanning: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onAddFiles,
  onDeleteFile,
  onStartAudit,
  isScanning
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileName, setNewFileName] = useState('routes/api.js');
  const [newFileContent, setNewFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFileList = async (fileList: FileList) => {
    const loadedFiles: ProjectFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const langMap: Record<string, string> = {
          js: 'javascript',
          jsx: 'javascript',
          ts: 'typescript',
          tsx: 'typescript',
          py: 'python',
          sql: 'sql',
          php: 'php',
          html: 'html',
          json: 'json'
        };

        loadedFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          path: file.name,
          content: text,
          size: file.size,
          language: langMap[ext] || 'text',
          uploadedAt: new Date().toLocaleTimeString()
        });
      } catch (err) {
        console.error(`Failed to read file ${file.name}:`, err);
      }
    }

    if (loadedFiles.length > 0) {
      onAddFiles(loadedFiles);
      if (loadedFiles[0]) {
        onSelectFile(loadedFiles[0].id);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split('.').pop()?.toLowerCase() || 'js';
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: newFileName.split('/').pop() || newFileName,
      path: newFileName,
      content: newFileContent || `// ${newFileName}\n// Paste your endpoint or controller logic here\n`,
      size: new Blob([newFileContent]).size,
      language: ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'py' ? 'python' : 'javascript',
      uploadedAt: new Date().toLocaleTimeString()
    };
    onAddFiles([newFile]);
    onSelectFile(newFile.id);
    setNewFileName('');
    setNewFileContent('');
    setShowAddModal(false);
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Top Banner & Audit Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Source Code Auditor</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            Upload & Audit Project Files ({files.length} loaded)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Start Batch Audit on All Files */}
          <button
            onClick={() => onStartAudit()}
            disabled={isScanning || files.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition-all ${
              isScanning || files.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50 cursor-pointer scale-100 hover:scale-[1.02]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Audit All Files ({files.length})</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200' 
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.py,.sql,.php,.html,.json,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Upload className="w-7 h-7 mx-auto mb-2 text-cyan-400" />
        <p className="text-xs font-semibold text-white">
          Drop your project files here, or <span className="text-cyan-400 underline">browse files</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Supports JavaScript, TypeScript, Python, SQL, PHP, and HTML (.js, .ts, .py, .sql, .php)
        </p>
      </div>

      {/* Action Strip: Add Single File / Clear */}
      <div className="flex items-center justify-between mt-3 mb-2 text-xs">
        <span className="font-semibold text-slate-400">Project Files</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Paste Code as New File</span>
        </button>
      </div>

      {/* Files List Horizontal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
        {files.map(file => {
          const isSelected = file.id === selectedFileId;
          const lineCount = file.content.split('\n').length;
          
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500/80 text-white shadow-md'
                  : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 truncate mr-2">
                <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="truncate">
                  <div className="font-semibold truncate text-[11px]">{file.path}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {lineCount} lines • {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {file.findingCount !== undefined && file.findingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded">
                    {file.findingCount} issues
                  </span>
                )}
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Remove file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Pasting Code as New File */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Create / Paste Project Code File</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">File Name & Relative Path</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. routes/payment.ts"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Source Code Content</label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  rows={8}
                  placeholder="Paste your route, controller, or SQL code here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAdd}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shadow-md shadow-cyan-950"
              >
                Add File to Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
