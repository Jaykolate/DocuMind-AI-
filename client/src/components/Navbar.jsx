import React from 'react';
import { 
  Upload, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  FolderOpen
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  documents = [], 
  selectedDocId, 
  setSelectedDocId,
  onOpenUpload,
  health
}) {
  const getTabDetails = () => {
    switch (activeTab) {
      case 'chat':
        return {
          title: 'Retrieval Augmented Generation Workspace',
          subtitle: 'Ask grounded questions across uploaded documents with strict zero-hallucination guardrails.'
        };
      case 'documents':
        return {
          title: 'Document Management & Vector Indexing',
          subtitle: 'Upload, parse, chunk, and inspect PDF/DOCX documents with automated embedding generation.'
        };
      case 'tools':
        return {
          title: 'AI Knowledge & Intelligence Tools',
          subtitle: 'Execute constrained agentic operations: semantic search, single-doc summarizer, and multi-doc comparator.'
        };
      case 'health':
        return {
          title: 'System Health & Engine Architecture',
          subtitle: 'Inspect live Gemini models, Qdrant cluster connectivity, and retrieval configuration.'
        };
      default:
        return { title: 'NexusRAG Platform', subtitle: 'Agentic Knowledge Retrieval' };
    }
  };

  const { title, subtitle } = getTabDetails();

  return (
    <header className="h-20 bg-[#0d121f]/90 border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Document Selector Filter (available in chat and tools) */}
        {(activeTab === 'chat' || activeTab === 'tools') && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">Context:</span>
            <select
              value={selectedDocId || ''}
              onChange={(e) => setSelectedDocId(e.target.value || null)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Uploaded Documents ({documents.length})</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-slate-900 text-slate-200">
                  {doc.filename} ({doc.chunkCount} chunks)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all shadow-indigo-600/20 active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>
    </header>
  );
}
