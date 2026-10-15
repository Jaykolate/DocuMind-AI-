import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Bookmark } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { citationId, filename, pageNumber, similarityScore, excerpt } = citation;
  const matchPercent = similarityScore ? Math.round(similarityScore * 100) : null;

  return (
    <div className="rounded-lg bg-slate-900/90 border border-slate-800 text-xs transition-all hover:border-slate-700">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold">
            Source {citationId}
          </span>
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate max-w-[150px] sm:max-w-[220px]" title={filename}>
            {filename}
          </span>
          <span className="text-[11px] text-slate-400">
            • p.{pageNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {matchPercent !== null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
              matchPercent >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              matchPercent >= 40 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-slate-800 text-slate-400'
            }`}>
              {matchPercent}% match
            </span>
          )}
          <button className="text-slate-400 hover:text-slate-200 p-0.5">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/40 rounded-b-lg">
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-indigo-400" /> Extracted Excerpt:
          </p>
          <div className="p-2.5 rounded bg-slate-900/90 border-l-2 border-indigo-500 font-serif text-slate-300 text-xs leading-relaxed italic max-h-48 overflow-y-auto">
            "{excerpt}"
          </div>
        </div>
      )}
    </div>
  );
}
