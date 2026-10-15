import React, { useState } from 'react';
import { X, FileText, Search } from 'lucide-react';

export default function DocumentDetailModal({ document, isOpen, onClose }) {
  const [filterText, setFilterText] = useState('');

  if (!isOpen || !document) return null;

  const chunks = document.chunks || [];
  const filteredChunks = filterText
    ? chunks.filter(c => c.content.toLowerCase().includes(filterText.toLowerCase()))
    : chunks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm truncate max-w-md">{document.filename}</h3>
              <p className="text-[11px] text-[#737373] font-mono">
                {document.fileType?.toUpperCase()} • {(document.fileSize / 1024).toFixed(1)} KB • {document.totalPages || 1} Pages • {document.chunkCount || chunks.length} Chunks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#737373] hover:text-white p-1 rounded hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-6 py-2 bg-[#000000] border-b border-[#222222] flex flex-wrap items-center gap-4 text-[11px] text-[#737373] font-mono shrink-0">
          <span>Hash: {document.fileHash?.slice(0, 10)}...</span>
          <span>Created: {new Date(document.createdAt).toLocaleDateString()}</span>
          <span className="text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span> {document.status}
          </span>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[#222222] bg-[#000000] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search through extracted chunks..."
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#555555]"
            />
          </div>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 bg-[#000000]">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-10 text-[#666666] text-xs font-mono">
              No matching chunks found.
            </div>
          ) : (
            filteredChunks.map((chunk, idx) => (
              <div 
                key={chunk.id || idx}
                className="p-3.5 rounded-lg bg-[#0a0a0a] border border-[#222222] hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-[#171717] text-white font-mono text-[10px] border border-[#333333]">
                      #{chunk.chunkIndex ?? idx}
                    </span>
                    <span className="text-[11px] text-[#737373] font-mono">
                      Page {chunk.pageNumber || 1}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#666666] font-mono">
                    {chunk.content?.length || 0} chars
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#000000] font-mono text-[#cccccc] text-xs leading-relaxed border border-[#1f1f1f]">
                  {chunk.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#0a0a0a] border-t border-[#222222] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-[#e5e5e5] text-black transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
