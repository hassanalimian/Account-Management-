import React, { useState, useEffect } from 'react';
import {
  FolderCode,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Database,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api.ts';
import { PhpFileRecord } from '../types.ts';

interface PhpSourceModalProps {
  onClose: () => void;
}

export const PhpSourceModal: React.FC<PhpSourceModalProps> = ({ onClose }) => {
  const [files, setFiles] = useState<PhpFileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<PhpFileRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPhpFiles()
      .then((data) => {
        setFiles(data.files || []);
        if (data.files && data.files.length > 0) {
          setSelectedFile(data.files[0]);
        }
      })
      .catch((err) => console.error('Failed to load PHP files', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename.replace('/', '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-5xl w-full shadow-2xl p-6 text-slate-800 h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <span>PHP + MySQL Production Source Code</span>
                <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  PHP 8.2+ / MySQL 8.0
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct export of modular PHP controllers, PDO database handlers, and normalized MySQL schemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split view */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden mt-4 gap-4">
          {/* File sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col shrink-0 overflow-y-auto">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
              System Files
            </div>
            <div className="space-y-1">
              {files.map((file) => {
                const isSelected = selectedFile?.filename === file.filename;
                const isSql = file.filename.endsWith('.sql');
                return (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center space-x-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {isSql ? (
                      <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate">{file.filename}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-500 p-2">
              <div className="font-bold text-slate-700 mb-1">LAMP Deployment:</div>
              <p className="text-xs leading-relaxed text-slate-500">
                1. Import <code className="text-blue-600 font-semibold font-mono">schema.sql</code> to MySQL.
                <br />
                2. Set credentials in <code className="text-emerald-600 font-semibold font-mono">config/db.php</code>.
                <br />
                3. Host on Apache, Nginx, or cPanel.
              </p>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-inner">
            {selectedFile && (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs shrink-0">
                  <div>
                    <span className="font-mono font-semibold text-emerald-400 text-xs">
                      /php/{selectedFile.filename}
                    </span>
                    <span className="text-slate-400 ml-2 hidden sm:inline text-xs">
                      ({selectedFile.category})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer text-xs font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center space-x-1.5 transition-colors font-semibold text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-200 leading-relaxed bg-slate-900 select-text">
                  <pre>{selectedFile.content}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
