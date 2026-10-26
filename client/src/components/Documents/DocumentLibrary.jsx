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
    if (!window.confirm(`Delete "${doc.filename}" and remove its vector embeddings?`)) {
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
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#09090b]">
      
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#141416] border border-[#27272a]">
          <p className="text-sm font-medium text-[#a1a1aa]">Documents</p>
          <h3 className="text-2xl font-semibold text-white mt-1.5">{documents.length}</h3>
        </div>

        <div className="p-5 rounded-xl bg-[#141416] border border-[#27272a]">
          <p className="text-sm font-medium text-[#a1a1aa]">Total Chunks</p>
          <h3 className="text-2xl font-semibold text-white mt-1.5">{totalChunks}</h3>
        </div>

        <div className="p-5 rounded-xl bg-[#141416] border border-[#27272a]">
          <p className="text-sm font-medium text-[#a1a1aa]">Storage</p>
          <h3 className="text-2xl font-semibold text-white mt-1.5">{(totalBytes / 1024 / 1024).toFixed(2)} MB</h3>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#1c1214] border border-[#3f1d24] text-[#fca5a5] text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#f87171] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl bg-[#141416] border border-[#27272a] overflow-hidden">
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-base">Document Library</h3>
            <p className="text-sm text-[#71717a] mt-0.5">Manage uploaded files and their vector status</p>
          </div>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#e4e4e7] text-black text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mx-auto text-[#71717a] mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="text-base font-medium text-white">No documents uploaded yet</h4>
            <p className="text-sm text-[#71717a] max-w-sm mx-auto mt-1 mb-5">
              Upload PDF or DOCX files to start asking questions with source citations.
            </p>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#e4e4e7] text-black text-sm font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#09090b]/60 text-[#71717a] border-b border-[#27272a] text-xs font-medium">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Pages</th>
                  <th className="px-5 py-3.5">Chunks</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 text-[#ededed]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#a1a1aa] shrink-0" />
                        <div className="truncate max-w-xs sm:max-w-md">
                          <p className="font-medium text-white truncate text-[15px]" title={doc.filename}>{doc.filename}</p>
                          <p className="text-xs text-[#71717a] uppercase font-mono mt-0.5">{doc.fileType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1f1f23] text-[#d4d4d8] border border-[#2e2e33]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#a1a1aa]">
                      {doc.totalPages || 1}
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {doc.chunkCount || 0}
                    </td>
                    <td className="px-5 py-4 text-[#a1a1aa]">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-5 py-4 text-[#71717a] text-xs">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectForChat(doc.id)}
                          className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                          title="Chat with document"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectForSummarize(doc.id)}
                          className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                          title="Summarize document"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleInspect(doc)}
                          className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                          title="Inspect chunks"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="p-2 rounded-lg text-[#a1a1aa] hover:text-rose-400 hover:bg-[#27272a] transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
