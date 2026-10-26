import React from 'react';
import CitationCard from './CitationCard';
import Logo from '../Logo';

function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-base font-semibold text-white mt-4 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-lg font-semibold text-white mt-5 mb-2.5 pb-1 border-b border-[#27272a]">
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().replace(/^(\*|-)\s+/, '');
      return (
        <li key={idx} className="ml-5 list-disc text-[#e4e4e7] leading-relaxed my-1.5 text-[16px]">
          {renderInlineStyles(content)}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-3" />;
    }
    return (
      <p key={idx} className="text-[#e4e4e7] leading-relaxed my-2 text-[16px]">
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
        <code key={i} className="px-1.5 py-0.5 rounded bg-[#27272a] font-mono text-[14px] text-[#ededed]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\[Source\s+\d+\]$/.test(part)) {
      return (
        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-[#1f1f23] text-[#a1a1aa] text-xs font-mono mx-1 border border-[#2e2e33]">
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
      <div className="flex justify-end my-4">
        <div className="max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl bg-[#27272a] text-white shadow-sm">
          <p className="text-[16px] leading-relaxed whitespace-pre-wrap font-normal">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const { answer, sources = [] } = message;

  return (
    <div className="flex items-start gap-4 my-6">
      {/* Assistant Logo */}
      <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center shrink-0 mt-1">
        <Logo className="w-5 h-5" />
      </div>

      {/* Answer & Sources */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="text-[16px] text-[#e4e4e7] leading-relaxed">
          {renderFormattedText(answer || message.content)}
        </div>

        {/* Source Citations */}
        {sources && sources.length > 0 && (
          <div className="pt-3 border-t border-[#27272a]/60">
            <div className="text-xs font-medium text-[#71717a] mb-2.5">
              Sources ({sources.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sources.map((src) => (
                <CitationCard key={src.citationId} citation={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
