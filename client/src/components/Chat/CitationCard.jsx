import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { citationId, filename, pageNumber, similarityScore, excerpt } = citation;
  const matchPercent = similarityScore ? Math.round(similarityScore * 100) : null;

  return (
    <div className="rounded-xl bg-[#141416] border border-[#27272a] text-sm transition-colors hover:border-[#3f3f46]">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer select-none gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded-md bg-[#27272a] text-[#d4d4d8] text-xs font-medium shrink-0">
            {citationId}
          </span>
          <FileText className="w-4 h-4 text-[#a1a1aa] shrink-0" />
          <span className="font-medium text-white truncate text-[14px]" title={filename}>
            {filename}
          </span>
          <span className="text-xs text-[#71717a] shrink-0">
            p.{pageNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {matchPercent !== null && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#1f1f23] text-[#a1a1aa] border border-[#2e2e33]">
              {matchPercent}%
            </span>
          )}
          <button className="text-[#71717a] hover:text-white p-0.5" aria-label="Toggle excerpt">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && excerpt && (
        <div className="px-3 pb-3 pt-1 border-t border-[#27272a]/60">
          <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a]/80 text-[#d4d4d8] text-[13px] leading-relaxed max-h-48 overflow-y-auto">
            "{excerpt}"
          </div>
        </div>
      )}
    </div>
  );
}
