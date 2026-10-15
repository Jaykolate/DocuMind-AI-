import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  Eye, 
  MessageSquare, 
  Sparkles, 
  Upload, 
  Layers, 
  AlertCircle,
  HardDrive,
  FileCode,
  FileSpreadsheet
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
    if (!window.confirm(`Are you sure you want to delete "${doc.filename}" and purge all its vectors from Qdrant?`)) {
      return;
    }

    setDeletingId(doc.id);
    setError(null);
    try {
      await api.deleteDocument(doc.id);
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete document and vectors.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  const totalBytes = documents.reduce((acc, d) => acc + (d.fileSize || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0a0e18]">
      
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Uploaded Documents</p>
            <h3 className="text-2xl font-bold text-white mt-1">{documents.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Indexed Chunks</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalChunks}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Corpus Size</p>
            <h3 className="text-2xl font-bold text-white mt-1">{(totalBytes / 1024 / 1024).toFixed(2)} MB</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table / Card Container */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-base">Knowledge Repository</h3>
            <p className="text-xs text-slate-400">All documents vectorized with text-embedding-004 and stored in Qdrant</p>
          </div>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No documents uploaded yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Upload your PDF or DOCX files to extract text, generate 768-dim embeddings, and start asking grounded questions.
            </p>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Your First Document</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800/80 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Document</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Pages</th>
                  <th className="px-6 py-3.5">Chunks</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {documents.map((doc) => {
                  const isPdf = doc.fileType === 'pdf';
                  const isDocx = doc.fileType === 'docx' || doc.fileType === 'doc';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate max-w-xs">
                            <p className="font-semibold text-slate-100 truncate" title={doc.filename}>{doc.filename}</p>
                            <p className="text-[11px] text-slate-400 uppercase font-mono">{doc.fileType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          doc.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'indexed' ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {doc.totalPages || 1}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold">
                          {doc.chunkCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectForChat(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Chat with this document"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectForSummarize(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Summarize document"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleInspect(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Inspect chunks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                            title="Delete document and purge vectors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Detail Inspection Modal */}
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
