import React from 'react';
import { Sparkles, User, ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';
import CitationCard from './CitationCard';

// Simple text renderer for markdown-like formatting (bold, lists, code blocks, citations)
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Header 3
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-base font-semibold text-indigo-200 mt-3 mb-1.5">
          {line.replace('### ', '')}
        </h3>
      );
    }
    // Header 2
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2 border-b border-slate-800 pb-1">
          {line.replace('## ', '')}
        </h2>
      );
    }
    // Bullet point
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().replace(/^(\*|-)\s+/, '');
      return (
        <li key={idx} className="ml-4 list-disc text-slate-200 leading-relaxed my-1">
          {renderInlineStyles(content)}
        </li>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    // Normal paragraph
    return (
      <p key={idx} className="text-slate-200 leading-relaxed my-1">
        {renderInlineStyles(line)}
      </p>
    );
  });
}

function renderInlineStyles(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[Source\s+\d+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-xs text-indigo-300 border border-slate-700/60">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\[Source\s+\d+\]$/.test(part)) {
      return (
        <span key={i} className="inline-block px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-semibold mx-0.5 border border-indigo-500/30">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="flex gap-3 max-w-[80%] items-start">
          <div className="p-4 rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant response
  const { answer, sources = [], metrics, isGrounded } = message;

  return (
    <div className="flex justify-start mb-6">
      <div className="flex gap-3 max-w-[92%] items-start">
        {/* Assistant Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1.5px] shrink-0 mt-1 shadow-md shadow-indigo-500/20">
          <div className="w-full h-full bg-[#0d121f] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        {/* Message Content Container */}
        <div className="flex-1 space-y-3">
          <div className="p-5 rounded-2xl rounded-tl-sm bg-[#131b2e] border border-slate-800 text-slate-100 shadow-lg">
            
            {/* Grounding Header */}
            {isGrounded !== undefined && (
              <div className="mb-3 pb-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs">
                {isGrounded ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" /> Grounded in Verified Document Context
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <AlertCircle className="w-4 h-4" /> Insufficient Document Evidence
                  </span>
                )}

                {/* Latency Chips */}
                {metrics && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {metrics.totalLatencyMs}ms total
                    </span>
                    {metrics.retrievalLatencyMs !== undefined && (
                      <span className="hidden sm:inline text-slate-400">
                        • R: {metrics.retrievalLatencyMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Answer Body */}
            <div className="text-sm space-y-2">
              {renderFormattedText(answer || message.content)}
            </div>

            {/* Source Citations Section */}
            {sources && sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Supporting Sources & Evidence ({sources.length}):
                  </h4>
                  <span className="text-[11px] text-slate-400">Click source to inspect excerpt</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sources.map((src) => (
                    <CitationCard key={src.citationId} citation={src} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
