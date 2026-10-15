import React from 'react';
import { User, AlertCircle } from 'lucide-react';
import CitationCard from './CitationCard';
import Logo from '../Logo';

function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-sm font-semibold text-white mt-3 mb-1">
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-base font-bold text-white mt-4 mb-2 border-b border-[#222222] pb-1">
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().replace(/^(\*|-)\s+/, '');
      return (
        <li key={idx} className="ml-4 list-disc text-[#cccccc] leading-relaxed my-1 text-xs">
          {renderInlineStyles(content)}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-[#cccccc] leading-relaxed my-1 text-xs">
        {renderInlineStyles(line)}
      </p>
    );
  });
}

function renderInlineStyles(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[Source\s+\d+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[#171717] font-mono text-[11px] text-[#ededed] border border-[#2e2e2e]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\[Source\s+\d+\]$/.test(part)) {
      return (
        <span key={i} className="inline-block px-1.5 py-0.2 rounded bg-[#171717] text-white font-mono text-[10px] mx-0.5 border border-[#333333]">
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
      <div className="flex justify-end mb-5">
        <div className="flex gap-2.5 max-w-[80%] items-start">
          <div className="p-3.5 rounded-lg bg-[#ffffff] text-[#000000]">
            <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
          </div>
          <div className="w-7 h-7 rounded-md bg-[#171717] border border-[#262626] flex items-center justify-center shrink-0 text-[#888888]">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  const { answer, sources = [], metrics, isGrounded } = message;

  return (
    <div className="flex justify-start mb-5">
      <div className="flex gap-2.5 max-w-[92%] items-start">
        {/* Assistant Avatar */}
        <Logo className="w-6 h-6 shrink-0 mt-0.5" />

        {/* Content Box */}
        <div className="flex-1 space-y-2.5">
          <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#222222] text-[#ededed]">
            
            {/* Grounding Header */}
            {isGrounded !== undefined && (
              <div className="mb-2.5 pb-2 border-b border-[#1f1f1f] flex items-center justify-between text-xs">
                {isGrounded ? (
                  <span className="flex items-center gap-1.5 text-white font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Grounded in Document Context
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#888888] font-medium text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" /> Insufficient Evidence
                  </span>
                )}

                {metrics && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#666666]">
                    <span>{metrics.totalLatencyMs}ms</span>
                    {metrics.retrievalLatencyMs !== undefined && (
                      <span className="hidden sm:inline">
                        • ret: {metrics.retrievalLatencyMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Answer */}
            <div className="space-y-1.5">
              {renderFormattedText(answer || message.content)}
            </div>

            {/* Sources */}
            {sources && sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1f1f1f]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">
                    Citations ({sources.length})
                  </span>
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
