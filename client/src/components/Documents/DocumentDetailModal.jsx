import React, { useState } from 'react';
import { X, FileText, Layers, Hash, Calendar, Search, BookOpen } from 'lucide-react';

export default function DocumentDetailModal({ document, isOpen, onClose }) {
  const [filterText, setFilterText] = useState('');

  if (!isOpen || !document) return null;

  const chunks = document.chunks || [];
  const filteredChunks = filterText
    ? chunks.filter(c => c.content.toLowerCase().includes(filterText.toLowerCase()))
    : chunks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base truncate max-w-md">{document.filename}</h3>
              <p className="text-xs text-slate-400">
                {document.fileType?.toUpperCase()} • {(document.fileSize / 1024).toFixed(1)} KB • {document.totalPages || 1} Pages • {document.chunkCount || chunks.length} Chunks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1 font-mono">
            <Hash className="w-3.5 h-3.5 text-slate-400" /> Hash: {document.fileHash?.slice(0, 12)}...
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Uploaded: {new Date(document.createdAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Status: {document.status}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search through extracted chunks..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching chunks found.
            </div>
          ) : (
            filteredChunks.map((chunk, idx) => (
              <div 
                key={chunk.id || idx}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold">
                      Chunk #{chunk.chunkIndex ?? idx}
                    </span>
                    <span className="text-xs text-slate-400">
                      Page {chunk.pageNumber || 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {chunk.content?.length || 0} characters
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 font-serif text-slate-300 text-xs leading-relaxed border-l-2 border-indigo-500/50">
                  {chunk.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
