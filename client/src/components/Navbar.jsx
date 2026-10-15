import React from 'react';
import { 
  Upload, 
  Folder
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  documents = [], 
  selectedDocId, 
  setSelectedDocId,
  onOpenUpload
}) {
  const getTabDetails = () => {
    switch (activeTab) {
      case 'chat':
        return {
          title: 'Retrieval Workspace',
          subtitle: 'Grounded question answering across your document corpus'
        };
      case 'documents':
        return {
          title: 'Document Repository',
          subtitle: 'Manage indexed PDF and DOCX files and inspect vector chunks'
        };
      case 'tools':
        return {
          title: 'Intelligence Tools',
          subtitle: 'Summarization, multi-document comparison, and direct vector search'
        };
      default:
        return { title: 'NexusRAG', subtitle: 'Agentic Knowledge Retrieval' };
    }
  };

  const { title, subtitle } = getTabDetails();

  return (
    <header className="h-16 bg-[#000000] border-b border-[#222222] px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-[11px] text-[#888888]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Document Selector Filter */}
        {(activeTab === 'chat' || activeTab === 'tools') && (
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] rounded-md px-2.5 py-1 text-xs">
            <Folder className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            <span className="text-[#888888]">Scope:</span>
            <select
              value={selectedDocId || ''}
              onChange={(e) => setSelectedDocId(e.target.value || null)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="" className="bg-[#0a0a0a] text-white">All Documents ({documents.length})</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-[#0a0a0a] text-white">
                  {doc.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Button - Vercel Black/White Primary Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#e5e5e5] text-black text-xs font-medium transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
