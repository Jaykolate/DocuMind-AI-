import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { citationId, filename, pageNumber, similarityScore, excerpt } = citation;
  const matchPercent = similarityScore ? Math.round(similarityScore * 100) : null;

  return (
    <div className="rounded-md bg-[#0a0a0a] border border-[#262626] text-xs transition-colors hover:border-[#383838]">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-1.5 py-0.5 rounded bg-[#171717] text-white font-mono text-[10px] border border-[#333333]">
            S{citationId}
          </span>
          <FileText className="w-3.5 h-3.5 text-[#888888] shrink-0" />
          <span className="font-medium text-white truncate max-w-[150px] sm:max-w-[200px]" title={filename}>
            {filename}
          </span>
          <span className="text-[11px] text-[#888888] font-mono">
            p.{pageNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {matchPercent !== null && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-[#a1a1a1] bg-[#141414] border border-[#262626]">
              {matchPercent}%
            </span>
          )}
          <button className="text-[#888888] hover:text-white p-0.5">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-[#1f1f1f] bg-[#000000]">
          <p className="text-[10px] text-[#666666] uppercase font-mono tracking-wider mb-1.5">
            Retrieved Excerpt
          </p>
          <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] text-[#cccccc] text-xs leading-relaxed max-h-48 overflow-y-auto font-mono">
            "{excerpt}"
          </div>
        </div>
      )}
    </div>
  );
}
