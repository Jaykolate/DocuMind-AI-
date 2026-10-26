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
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
              <FileText className="w-5 h-5 text-[#a1a1aa]" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base truncate max-w-md">{document.filename}</h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                {document.fileType?.toUpperCase()} • {(document.fileSize / 1024).toFixed(1)} KB • {document.totalPages || 1} Pages • {document.chunkCount || chunks.length} Chunks
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#71717a] hover:text-white p-1.5 rounded-lg hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-[#27272a] bg-[#09090b] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter chunks..."
              className="w-full bg-[#141416] border border-[#27272a] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
            />
          </div>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#09090b]">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-12 text-[#71717a] text-sm">
              No matching chunks found.
            </div>
          ) : (
            filteredChunks.map((chunk, idx) => (
              <div 
                key={chunk.id || idx}
                className="p-4 rounded-xl bg-[#141416] border border-[#27272a] hover:border-[#3f3f46] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#27272a] text-white font-mono">
                      #{chunk.chunkIndex ?? idx}
                    </span>
                    <span>Page {chunk.pageNumber || 1}</span>
                  </div>
                  <span>{chunk.content?.length || 0} characters</span>
                </div>
                <div className="p-3 rounded-lg bg-[#09090b] text-[#d4d4d8] text-sm leading-relaxed border border-[#27272a]/60 font-sans whitespace-pre-wrap">
                  {chunk.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#141416] border-t border-[#27272a] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-white hover:bg-[#e4e4e7] text-black transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
