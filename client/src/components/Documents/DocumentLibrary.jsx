import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Sparkles, 
  Upload, 
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import DocumentDetailModal from './DocumentDetailModal';

export default function DocumentLibrary({ 
  documents = [], 
  onRefresh, 
  onOpenUpload,
  onSelectForChat,
  onSelectForSummarize
}) {
  const [selectedDocForModal, setSelectedDocForModal] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const handleInspect = async (doc) => {
    setIsLoadingDetail(true);
    try {
      const data = await api.getDocumentById(doc.id);
      setSelectedDocForModal(data.document);
    } catch (err) {
      console.error('Failed to load document details:', err);
      setError('Failed to fetch full document chunks.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.filename}" and purge all its vectors?`)) {
      return;
    }

    setDeletingId(doc.id);
    setError(null);
    try {
      await api.deleteDocument(doc.id);
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  const totalBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#000000]">
      
      {/* Top Metrics Strip - Vercel Minimalist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <p className="text-[11px] font-mono uppercase text-[#737373]">Documents</p>
          <h3 className="text-xl font-semibold text-white mt-1 font-mono">{documents.length}</h3>
        </div>

        <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <p className="text-[11px] font-mono uppercase text-[#737373]">Total Chunks</p>
          <h3 className="text-xl font-semibold text-white mt-1 font-mono">{totalChunks}</h3>
        </div>

        <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#222222]">
          <p className="text-[11px] font-mono uppercase text-[#737373]">Storage</p>
          <h3 className="text-xl font-semibold text-white mt-1 font-mono">{(totalBytes / 1024 / 1024).toFixed(2)} MB</h3>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#888888] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-lg bg-[#0a0a0a] border border-[#222222] overflow-hidden">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">Indexed Documents</h3>
            <p className="text-[11px] text-[#737373]">Vectorized corpus available for semantic retrieval</p>
          </div>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#e5e5e5] text-black text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-14 px-4">
            <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center mx-auto text-[#666666] mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-medium text-white">No documents uploaded</h4>
            <p className="text-[11px] text-[#737373] max-w-sm mx-auto mt-1 mb-4">
              Upload PDF or DOCX files to extract text, generate 768-dim embeddings, and query.
            </p>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#e5e5e5] text-black text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#000000] text-[#737373] border-b border-[#222222] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Pages</th>
                  <th className="px-5 py-3">Chunks</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c] text-[#ededed]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#121212] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#737373] shrink-0" />
                        <div className="truncate max-w-xs">
                          <p className="font-medium text-white truncate text-xs" title={doc.filename}>{doc.filename}</p>
                          <p className="text-[10px] text-[#737373] uppercase font-mono">{doc.fileType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-white border border-[#262626]">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#888888]">
                      {doc.totalPages || 1}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-white">
                      {doc.chunkCount || 0}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#888888]">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-5 py-3.5 text-[#737373] font-mono text-[10px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectForChat(doc.id)}
                          className="p-1.5 rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                          title="Chat with document"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectForSummarize(doc.id)}
                          className="p-1.5 rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                          title="Summarize document"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleInspect(doc)}
                          className="p-1.5 rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                          title="Inspect chunks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedDocForModal && (
        <DocumentDetailModal
          isOpen={Boolean(selectedDocForModal)}
          document={selectedDocForModal}
          onClose={() => setSelectedDocForModal(null)}
        />
      )}
    </div>
  );
}
