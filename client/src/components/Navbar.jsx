import React from 'react';
import { Upload, ChevronDown } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  documents = [], 
  selectedDocId, 
  setSelectedDocId,
  onOpenUpload
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Document Assistant';
      case 'documents':
        return 'Documents';
      case 'tools':
        return 'Intelligence Tools';
      default:
        return 'NexusRAG';
    }
  };

  return (
    <header className="h-16 bg-[#09090b] border-b border-[#27272a] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          {getTabTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Simple Document Scope Selector */}
        {(activeTab === 'chat' || activeTab === 'tools') && (
          <div className="relative">
            <select
              value={selectedDocId || ''}
              onChange={(e) => setSelectedDocId(e.target.value || null)}
              className="appearance-none bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] text-[#e4e4e7] text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[260px] truncate transition-colors"
            >
              <option value="" className="bg-[#18181b] text-white">All documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-[#18181b] text-white">
                  {doc.filename}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#71717a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#e4e4e7] text-black text-sm font-medium transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
